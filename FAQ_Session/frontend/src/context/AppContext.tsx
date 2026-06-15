import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, QuestionStatus } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { apiService, ApiErrorCode, getApiErrorCode, getApiErrorMessage } from '../utils/api';

interface AppContextType {
  questions: Question[];   // queries (non-FAQ)
  faqs: Question[];        // FAQ entries
  loading: boolean;
  dataError: string | null; // non-null when initial load failed
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
  reportQuery: (queryId: string, reason: string) => Promise<void>;
  getReportedQueries: () => Promise<Question[]>;
  ignoreQuery: (queryId: string) => Promise<void>;
  warnQuery: (queryId: string) => Promise<void>;
  penalizeQuery: (queryId: string) => Promise<void>;
  deleteReportedQuery: (queryId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, openLoginModal, authLoading, refreshCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [faqs, setFaqs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadBackendData = async () => {
    setLoading(true);
    setDataError(null);
    try {
      const { questions: backendFaqs, sourceQueryMap } = await apiService.getFaqs();
      const backendQueries = await apiService.getQueries(sourceQueryMap);
      setFaqs(backendFaqs);
      setQuestions(backendQueries);
    } catch (err: unknown) {
      // Never log stack traces; surface a friendly message via state
      const message =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to load data from the server.';
      setDataError(message);
      showToast('Could not connect to the server. Some content may be unavailable.', 'error');
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
  };

  const refreshData = async () => {
    await loadBackendData();
  };

  const askQuestion = async (title: string, description: string) => {
    try {
      const newQuestion = await apiService.createQuery(title, description);
      setQuestions(prev => [newQuestion, ...prev]);
      await refreshCurrentUser();
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        'Failed to post your question. Please try again.';
      showToast(message, 'error');
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
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.message ||
        'Failed to post your reply. Please try again.';
      showToast(message, 'error');
      throw err;
    }
  };

  const acceptAnswer = async (questionId: string, answerId: string) => {
    if (!checkAuth() || !currentUser) return;
    try {
      await apiService.approveReply(answerId);
      await loadBackendData();
    } catch (err) {
      handleAdminActionError(err, 'Failed to approve this reply. Please try again.');
    }
  };

  const promoteToFaq = async (questionId: string) => {
    if (!checkAuth() || !currentUser) return;
    if (currentUser.role !== 'ADMIN') return;

    try {
      await apiService.promoteToFaq(questionId);
      showToast('Query promoted to FAQ successfully!', 'success');
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

  const reportQuery = async (queryId: string, reason: string) => {
    await apiService.reportQuery(queryId, reason);
  };

  const getReportedQueries = async (): Promise<Question[]> => {
    return await apiService.getReportedQueries();
  };

  const ignoreQuery = async (queryId: string) => {
    await apiService.ignoreQuery(queryId);
    await refreshData();
  };

  const warnQuery = async (queryId: string) => {
    await apiService.warnQuery(queryId);
    await refreshData();
  };

  const penalizeQuery = async (queryId: string) => {
    await apiService.penalizeQuery(queryId);
    await refreshData();
  };

  const deleteReportedQuery = async (queryId: string) => {
    await apiService.deleteReportedQuery(queryId);
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        questions,
        faqs,
        loading,
        dataError,
        askQuestion,
        postAnswer,
        acceptAnswer,
        promoteToFaq,
        deleteQuestion,
        deleteReply,
        refreshData,
        getStats,
        reportQuery,
        getReportedQueries,
        ignoreQuery,
        warnQuery,
        penalizeQuery,
        deleteReportedQuery,
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
