import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, Answer, QuestionStatus } from '../types';
import { useAuth } from './AuthContext';
import { apiService } from '../utils/api';

interface AppContextType {
  questions: Question[];
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
const { currentUser, openLoginModal, authLoading } = useAuth();

const [questions, setQuestions] = useState<Question[]>([]);
const [loading, setLoading] = useState(true);

const isAdmin = currentUser?.role === 'ADMIN';

const loadBackendData = async () => {
  setLoading(true);
  try {
    const [backendFaqs, backendQueries] = await Promise.all([
      apiService.getFaqs(),
      apiService.getQueries(isAdmin),
    ]);
    setQuestions([...backendFaqs, ...backendQueries]);
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

  const refreshData = async () => {
    await loadBackendData();
  };

  const askQuestion = async (title: string, description: string) => {
    if (!checkAuth() || !currentUser) return;
    try {
      const newQuestion = await apiService.createQuery(title, description);
      setQuestions(prev => [newQuestion, ...prev]);
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
      await loadBackendData();
    } catch (err) {
      console.error('Failed to accept/approve answer on backend:', err);
      throw err;
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
      console.error('Failed to convert question to FAQ:', err);
      throw err;
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
            return { ...q, answers: updatedAnswers, status: newStatus as any };
          }
          return q;
        })
      );
    } catch (err) {
      console.error('Failed to delete reply:', err);
      throw err;
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const q = questions.find(item => item.id === questionId);
      if (!q) return;
      if (q.isOfficial) {
        await apiService.deleteFaq(questionId);
      } else {
        await apiService.deleteQuery(questionId);
      }
      setQuestions(prev => prev.filter(item => item.id !== questionId));
    } catch (err) {
      console.error('Failed to delete FAQ/Query on backend:', err);
      throw err;
    }
  };

  const getStats = () => {
    const totalFAQs = questions.filter(q => q.isOfficial).length;
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
