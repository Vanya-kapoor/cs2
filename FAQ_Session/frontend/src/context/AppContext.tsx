import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, Answer, QuestionStatus } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiService, ApiErrorCode, getApiErrorCode, getApiErrorMessage } from '../utils/api';

interface AppContextType {
  questions: Question[];   // only queries (non-FAQ)
  faqs: Question[];        // only FAQ entries
  loading: boolean;
  askQuestion: (title: string, description: string) => Promise<void>;
  postAnswer: (questionId: string, content: string) => Promise<void>;
  acceptAnswer: (questionId: string, answerId: string) => Promise<void>;
  convertToFAQ: (questionId: string) => Promise<void>;
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

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadBackendData = async () => {
    setLoading(true);
    try {
      const [backendFaqs, backendQueries] = await Promise.all([
        apiService.getFaqs(),
        apiService.getQueries(isAdmin),
      ]);
      // Keep FAQs and queries completely separate
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

  // Surfaces a friendly toast for the admin-gating 403s
  // (STALE_ROLE_SESSION / EMAIL_VERIFICATION_REQUIRED) that the backend
  // returns, instead of letting a raw AxiosError bubble up to the console
  // (and, for fire-and-forget calls, the page).
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
      // Re-fetch user stats so Profile page questionsAsked increments immediately
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

  const acceptAnswer = async (questionId: string, answerId: string) => {
    if (!checkAuth() || !currentUser) return;
    try {
      await apiService.approveReply(answerId);
      // Full reload so the approved reply gets promoted to FAQ in the faqs list
      // and the query section shows the correct locked state
      await loadBackendData();
    } catch (err) {
      handleAdminActionError(err, 'Failed to approve this reply. Please try again.');
    }
  };

  const convertToFAQ = async (questionId: string) => {
    if (!checkAuth() || !currentUser) return;
    if (currentUser.role !== 'ADMIN') return;

    const q = questions.find(item => item.id === questionId);
    if (!q || q.answers.length === 0) return;

    try {
      const bestAnswer = q.answers.find(a => a.isAccepted) || q.answers[0];
      await apiService.createFaq(q.title, bestAnswer.content);
      await loadBackendData();
    } catch (err) {
      handleAdminActionError(err, 'Failed to convert this question to an FAQ. Please try again.');
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
      // Check FAQs first, then queries
      const isFaq = faqs.some(f => f.id === questionId);
      if (isFaq) {
        await apiService.deleteFaq(questionId);
        setFaqs(prev => prev.filter(f => f.id !== questionId));
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
        convertToFAQ,
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
