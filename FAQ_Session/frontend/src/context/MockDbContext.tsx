import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, Answer, Notification, QuestionStatus, User } from '../types';
import { initialQuestions, initialNotifications, mockUsers } from '../utils/mockData';
import { useAuth } from './AuthContext';
import { apiService } from '../utils/api';

interface MockDbContextType {
  questions: Question[];
  notifications: Notification[];
  askQuestion: (title: string, description: string, category: string, tags: string[]) => void;
  postAnswer: (questionId: string, content: string) => void;
  upvoteQuestion: (questionId: string) => boolean;
  upvoteAnswer: (questionId: string, answerId: string) => boolean;
  bookmarkQuestion: (questionId: string) => boolean;
  followQuestion: (questionId: string) => boolean;
  acceptAnswer: (questionId: string, answerId: string) => void;
  escalateQuestion: (questionId: string) => void;
  changeQuestionStatus: (questionId: string, status: QuestionStatus) => void;
  convertToFAQ: (questionId: string) => void;
  deleteQuestion: (questionId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  getStats: () => {
    totalFAQs: number;
    openQuestions: number;
    escalatedQuestions: number;
    answeredQuestions: number;
    activeInterns: number;
  };
}

const MockDbContext = createContext<MockDbContextType | undefined>(undefined);

export const MockDbProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, openLoginModal } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('internhub_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Dynamically load all FAQs and queries on mount
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [backendFaqs, backendQueries] = await Promise.all([
          apiService.getFaqs(),
          apiService.getQueries()
        ]);
        setQuestions([...backendFaqs, ...backendQueries]);
      } catch (err) {
        console.error('Failed to sync backend data:', err);
      }
    };
    loadBackendData();
  }, []);

  useEffect(() => {
    localStorage.setItem('internhub_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const checkAuth = (): boolean => {
    if (!currentUser) {
      openLoginModal();
      return false;
    }
    return true;
  };

  const askQuestion = async (title: string, description: string, category: string, tags: string[]) => {
    if (!checkAuth() || !currentUser) return;

    try {
      const newQuestion = await apiService.createQuery(title, description);
      setQuestions(prev => [newQuestion, ...prev]);

      // Update user stats locally for fast UX feedback
      currentUser.stats.questionsAsked += 1;
      currentUser.stats.reputation += 10;
    } catch (err) {
      console.error('Failed to raise query on backend:', err);
    }
  };

  const postAnswer = async (questionId: string, content: string) => {
    if (!checkAuth() || !currentUser) return;

    try {
      const newAnswer = await apiService.addReply(questionId, content);

      setQuestions(prev => prev.map(q => {
        if (q.id === questionId) {
          // Create notification for question author
          if (q.author.id !== currentUser.id) {
            const newNotif: Notification = {
              id: `n_${Date.now()}`,
              type: newAnswer.isOfficial ? 'OFFICIAL_ANSWER' : 'ANSWER_RECEIVED',
              title: newAnswer.isOfficial ? 'Official Answer Posted' : 'New Answer Received',
              content: `${currentUser.name} (${currentUser.role}) answered your question: "${q.title.substring(0, 30)}..."`,
              createdAt: new Date().toISOString(),
              read: false,
              questionId,
            };
            setNotifications(old => [newNotif, ...old]);
          }

          // Increment answer stats
          currentUser.stats.answersPosted += 1;
          currentUser.stats.reputation += 15;

          // Auto transition status if answered
          let newStatus: QuestionStatus = q.status;
          if (q.status === 'OPEN' || q.status === 'ESCALATED') {
            newStatus = 'ANSWERED';
          }

          return {
            ...q,
            status: newStatus,
            needsAttention: false,
            answers: [...q.answers, newAnswer],
          };
        }
        return q;
      }));
    } catch (err) {
      console.error('Failed to post reply to backend:', err);
    }
  };

  const upvoteQuestion = (questionId: string): boolean => {
    if (!checkAuth() || !currentUser) return false;

    let upvoted = false;

    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const hasUpvoted = q.upvotedBy.includes(currentUser.id);
        let upvotedByList = [...q.upvotedBy];
        let upvotesDiff = 0;

        if (hasUpvoted) {
          // Remove upvote
          upvotedByList = upvotedByList.filter(id => id !== currentUser.id);
          upvotesDiff = -1;
          upvoted = false;
        } else {
          // Add upvote
          upvotedByList.push(currentUser.id);
          upvotesDiff = 1;
          upvoted = true;

          // Increase reputation of author
          if (q.author.id !== currentUser.id) {
            q.author.stats.reputation += 5;
            q.author.stats.upvotesReceived += 1;
          }
        }

        return {
          ...q,
          upvotes: q.upvotes + upvotesDiff,
          upvotedBy: upvotedByList,
        };
      }
      return q;
    }));

    return upvoted;
  };

  const upvoteAnswer = (questionId: string, answerId: string): boolean => {
    if (!checkAuth() || !currentUser) return false;

    let upvoted = false;

    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const updatedAnswers = q.answers.map(ans => {
          if (ans.id === answerId) {
            // We'll store answer upvoted info in local storage context mapping or fake increment
            ans.upvotes += 1;
            upvoted = true;
            if (ans.author.id !== currentUser.id) {
              ans.author.stats.reputation += 10;
            }
          }
          return ans;
        });

        return {
          ...q,
          answers: updatedAnswers,
        };
      }
      return q;
    }));

    return upvoted;
  };

  const bookmarkQuestion = (questionId: string): boolean => {
    if (!checkAuth() || !currentUser) return false;

    let bookmarked = false;

    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const hasBookmarked = q.bookmarkedBy.includes(currentUser.id);
        let bookmarkedByList = [...q.bookmarkedBy];

        if (hasBookmarked) {
          bookmarkedByList = bookmarkedByList.filter(id => id !== currentUser.id);
          bookmarked = false;
        } else {
          bookmarkedByList.push(currentUser.id);
          bookmarked = true;
        }

        return {
          ...q,
          bookmarkedBy: bookmarkedByList,
        };
      }
      return q;
    }));

    return bookmarked;
  };

  const followQuestion = (questionId: string): boolean => {
    if (!checkAuth() || !currentUser) return false;

    let followed = false;

    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const hasFollowed = q.followedBy.includes(currentUser.id);
        let followedByList = [...q.followedBy];

        if (hasFollowed) {
          followedByList = followedByList.filter(id => id !== currentUser.id);
          followed = false;
        } else {
          followedByList.push(currentUser.id);
          followed = true;
        }

        return {
          ...q,
          followers: q.followers + (followed ? 1 : -1),
          followedBy: followedByList,
        };
      }
      return q;
    }));

    return followed;
  };

  const acceptAnswer = async (questionId: string, answerId: string) => {
    if (!checkAuth() || !currentUser) return;

    try {
      await apiService.approveReply(answerId);
      // Re-fetch FAQs & Queries from the backend to get the newly created official FAQ!
      const [backendFaqs, backendQueries] = await Promise.all([
        apiService.getFaqs(),
        apiService.getQueries()
      ]);
      setQuestions([...backendFaqs, ...backendQueries]);
    } catch (err) {
      console.error('Failed to accept/approve answer on backend:', err);
    }
  };

  const escalateQuestion = (questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        // Trigger admin alert notification
        const newNotif: Notification = {
          id: `n_${Date.now()}`,
          type: 'ESCALATED',
          title: 'Question Escalated!',
          content: `Question escalated: "${q.title.substring(0, 30)}..." requires an official review.`,
          createdAt: new Date().toISOString(),
          read: false,
          questionId,
        };
        setNotifications(old => [newNotif, ...old]);

        return {
          ...q,
          status: 'ESCALATED' as QuestionStatus,
          needsAttention: true,
        };
      }
      return q;
    }));
  };

  const changeQuestionStatus = (questionId: string, status: QuestionStatus) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          status,
          needsAttention: status === 'OPEN' || status === 'ESCALATED',
        };
      }
      return q;
    }));
  };

  const convertToFAQ = async (questionId: string) => {
    if (!checkAuth() || !currentUser) return;
    if (currentUser.role !== 'ADMIN') return;

    const q = questions.find(item => item.id === questionId);
    if (!q || q.answers.length === 0) return;

    try {
      const bestAnswer = q.answers.find(a => a.isAccepted) || q.answers[0];
      await apiService.createFaq(q.title, bestAnswer.content);
      
      const [backendFaqs, backendQueries] = await Promise.all([
        apiService.getFaqs(),
        apiService.getQueries()
      ]);
      setQuestions([...backendFaqs, ...backendQueries]);
    } catch (err) {
      console.error('Failed to convert question to FAQ:', err);
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
    }
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getStats = () => {
    const totalFAQs = questions.filter(q => q.isOfficial).length;
    const openQuestions = questions.filter(q => q.status === 'OPEN').length;
    const escalatedQuestions = questions.filter(q => q.status === 'ESCALATED').length;
    const answeredQuestions = questions.filter(q => q.status === 'ANSWERED' || q.status === 'RESOLVED').length;
    
    // Sum active contributors
    const activeInterns = Object.keys(mockUsers).length;

    return {
      totalFAQs,
      openQuestions,
      escalatedQuestions,
      answeredQuestions,
      activeInterns,
    };
  };

  return (
    <MockDbContext.Provider
      value={{
        questions,
        notifications,
        askQuestion,
        postAnswer,
        upvoteQuestion,
        upvoteAnswer,
        bookmarkQuestion,
        followQuestion,
        acceptAnswer,
        escalateQuestion,
        changeQuestionStatus,
        convertToFAQ,
        deleteQuestion,
        markNotificationRead,
        markAllNotificationsRead,
        getStats,
      }}
    >
      {children}
    </MockDbContext.Provider>
  );
};

export const useMockDb = () => {
  const context = useContext(MockDbContext);
  if (context === undefined) {
    throw new Error('useMockDb must be used within a MockDbProvider');
  }
  return context;
};
