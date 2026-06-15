import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, Answer, QuestionStatus } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiService, ApiErrorCode, getApiErrorCode, getApiErrorMessage } from '../utils/api';

interface AppContextType {
  questions: Question[];   // queries (non-FAQ)
  faqs: Question[];        // FAQ entries
  loading: boolean;
  askQuestion: (title: string, description: string) => Promise<void>;
  postAnswer: (questionId: string, content: string) => Promise<void>;
  acceptAnswer: (questionId: string, answerId: string) => Promise<void>;
  promoteToFaq: (questionId: string) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
  deleteReply: (questionId: string, replyId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getStats: () => {
    totalFAQs: number;
    openQuestions: number;
    answeredQuestions: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, openLoginModal, authLoading, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [faqs, setFaqs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBackendData = async () => {
    setLoading(true);
    try {
      // Fetch FAQs first to build the sourceQueryId → faqId map,
      // then pass it to getQueries so each query knows if it's already promoted.
      const { questions: backendFaqs, sourceQueryMap } = await apiService.getFaqs();
      const backendQueries = await apiService.getQueries(sourceQueryMap);
      setFaqs(backendFaqs);
      setQuestions(backendQueries);
    } catch (err) {
      console.error('Failed to sync backend data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadBackendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser?.role]);

  const checkAuth = (): boolean => {
    if (!currentUser) {
      openLoginModal();
      return false;
    }
    return true;
  };

  const handleAdminActionError = (err: unknown, fallbackMessage: string) => {
    const code = getApiErrorCode(err);

    if (code === ApiErrorCode.STALE_ROLE_SESSION) {
      showToast('Your session is out of date and your permissions may have changed. Please sign in again.', 'error');
      return;
    }

    if (code === ApiErrorCode.EMAIL_VERIFICATION_REQUIRED) {
      showToast('Verify your email to unlock admin actions. Check the banner above for a resend link.', 'error');
      return;
    }

    const message = getApiErrorMessage(err) || fallbackMessage;
    showToast(message, 'error');
    console.error(fallbackMessage, err);
  };

  const refreshData = async () => {
    await loadBackendData();
  };

  const askQuestion = async (title: string, description: string) => {
    try {
      const newQuestion = await apiService.createQuery(title, description);
      setQuestions(prev => [newQuestion, ...prev]);
      await refreshCurrentUser();
    } catch (err) {
      console.error('Failed to raise query on backend:', err);
      throw err;
    }
  };

  const postAnswer = async (questionId: string, content: string) => {
    if (!checkAuth() || !currentUser) return;
    try {
      const newAnswer = await apiService.addReply(questionId, content);

      setQuestions(prev =>
        prev.map(q => {
          if (q.id === questionId) {
            const newStatus: QuestionStatus =
              q.status === 'OPEN' ? 'ANSWERED' : q.status;
            return {
              ...q,
              status: newStatus,
              answers: [...q.answers, newAnswer],
            };
          }
          return q;
        })
      );
    } catch (err) {
      console.error('Failed to post reply to backend:', err);
      throw err;
    }
  };

  /**
   * Approve a reply — marks the query RESOLVED.
   * Does NOT create a FAQ. Admin must separately click "Promote to FAQ".
   */
  const acceptAnswer = async (questionId: string, answerId: string) => {
    if (!checkAuth() || !currentUser) return;
    try {
      await apiService.approveReply(answerId);
      // Reload so status and reply.isApproved reflect correctly
      await loadBackendData();
    } catch (err) {
      handleAdminActionError(err, 'Failed to approve this reply. Please try again.');
    }
  };

  /**
   * Promote a RESOLVED query's approved reply to a FAQ entry.
   * Only valid when query.status === 'RESOLVED' and query.linkedFaqId is null.
   */
  const promoteToFaq = async (questionId: string) => {
    if (!checkAuth() || !currentUser) return;
    if (currentUser.role !== 'ADMIN') return;

    try {
      await apiService.promoteToFaq(questionId);
      showToast('Query promoted to FAQ successfully!', 'success');
      // Full reload so linkedFaqId is populated on the query and FAQ appears in list
      await loadBackendData();
    } catch (err) {
      handleAdminActionError(err, 'Failed to promote this query to FAQ. Please try again.');
    }
  };

  const deleteReply = async (questionId: string, replyId: string) => {
    try {
      await apiService.deleteReply(replyId);
      setQuestions(prev =>
        prev.map(q => {
          if (q.id === questionId) {
            const updatedAnswers = q.answers.filter(a => a.id !== replyId);
            const newStatus = updatedAnswers.length === 0 ? 'OPEN' : q.status;
            return { ...q, answers: updatedAnswers, status: newStatus as QuestionStatus };
          }
          return q;
        })
      );
    } catch (err) {
      handleAdminActionError(err, 'Failed to delete this reply. Please try again.');
      throw err;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const isFaq = faqs.some(f => f.id === questionId);
      if (isFaq) {
        await apiService.deleteFaq(questionId);
        setFaqs(prev => prev.filter(f => f.id !== questionId));
        // Update any query that was linked to this FAQ so it can be re-promoted
        setQuestions(prev =>
          prev.map(q => q.linkedFaqId === questionId ? { ...q, linkedFaqId: null } : q)
        );
      } else {
        await apiService.deleteQuery(questionId);
        setQuestions(prev => prev.filter(q => q.id !== questionId));
      }
    } catch (err) {
      handleAdminActionError(err, 'Failed to delete this item. Please try again.');
    }
  };

  const getStats = () => {
    const totalFAQs = faqs.length;
    const openQuestions = questions.filter(q => q.status === 'OPEN').length;
    const answeredQuestions = questions.filter(
      q => q.status === 'ANSWERED' || q.status === 'RESOLVED'
    ).length;
    return { totalFAQs, openQuestions, answeredQuestions };
  };

  return (
    <AppContext.Provider
      value={{
        questions,
        faqs,
        loading,
        askQuestion,
        postAnswer,
        acceptAnswer,
        promoteToFaq,
        deleteQuestion,
        deleteReply,
        refreshData,
        getStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
};

export default AppContext;
