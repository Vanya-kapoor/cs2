import axios from 'axios';
import { Question, Answer, User, QuestionStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ensure JSON content-type on every request
apiClient.interceptors.request.use((config) => {
  if (config.data && typeof config.data === 'object') {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Map backend role strings to frontend UserRole
const mapRole = (role?: string): 'ADMIN' | 'INTERN' | 'MENTOR' => {
  if (!role) return 'INTERN';
  const r = role.toLowerCase();
  if (r === 'admin') return 'ADMIN';
  if (r === 'mentor') return 'MENTOR';
  return 'INTERN';
};

export const mapFaqToQuestion = (faq: any): Question => ({
  id: faq._id,
  title: faq.question,
  description: 'Official verified FAQ answer.',
  tags: faq.tags || ['faq', 'official'],
  isOfficial: true,
  isAccepted: true,
  status: 'RESOLVED',
  createdAt: faq.createdAt || new Date().toISOString(),
  author: {
    id: faq.createdBy?._id || faq.createdBy || 'system',
    name: faq.createdBy?.name || 'Vicharanashala Lab',
    role: mapRole(faq.createdBy?.role),
    avatar: faq.createdBy?.image || '🎓',
    stats: { questionsAsked: 0, answersPosted: 0, upvotesReceived: 0, reputation: 0 },
    badges: [],
  },
  answers: [
    {
      id: `${faq._id}_ans`,
      questionId: faq._id,
      author: {
        id: faq.createdBy?._id || faq.createdBy || 'system',
        name: faq.createdBy?.name || 'Vicharanashala Lab',
        role: mapRole(faq.createdBy?.role),
        avatar: faq.createdBy?.image || '🎓',
        stats: { questionsAsked: 0, answersPosted: 0, upvotesReceived: 0, reputation: 0 },
        badges: [],
      },
      content: faq.answer,
      isOfficial: true,
      isAccepted: true,
      createdAt: faq.createdAt || new Date().toISOString(),
    },
  ],
});

export const mapQueryToQuestion = (query: any, replies: any[] = []): Question => {
  const mappedAnswers: Answer[] = replies.map((rep) => ({
    id: rep._id,
    questionId: query._id,
    author: {
      id: rep.userId?._id || rep.userId || 'user',
      name: rep.userId?.name || 'Contributor',
      role: mapRole(rep.userId?.role),
      avatar: rep.userId?.image || '🦊',
      stats: { questionsAsked: 0, answersPosted: 0, upvotesReceived: 0, reputation: 0 },
      badges: [],
    },
    content: rep.content,
    isOfficial: rep.userId?.role === 'admin' || rep.userId?.role === 'mentor',
    isAccepted: rep.isApproved,
    createdAt: rep.createdAt,
  }));

  const hasAccepted = mappedAnswers.some((ans) => ans.isAccepted);

  const mapQueryStatus = (s: string): QuestionStatus => {
    if (s === 'resolved') return 'RESOLVED';
    if (s === 'answered') return 'ANSWERED';
    return 'OPEN';
  };

  return {
    id: query._id,
    title: query.title,
    description: query.description || '',
    tags: query.tags || ['query'],
    isOfficial: false,
    isAccepted: hasAccepted,
    status: hasAccepted ? 'RESOLVED' : mapQueryStatus(query.status),
    createdAt: query.createdAt,
    author: {
      id: query.createdBy?._id || query.createdBy || 'anonymous',
      name: query.createdBy?.name || 'Anonymous',
      role: mapRole(query.createdBy?.role),
      avatar: query.createdBy?.image || '🧑‍💻',
      stats: { questionsAsked: 0, answersPosted: 0, upvotesReceived: 0, reputation: 0 },
      badges: [],
      warnings: query.createdBy?.warnings || 0,
      reputationPenalty: query.createdBy?.reputationPenalty || 0,
    },
    answers: mappedAnswers,
    reportCount: query.reportCount || 0,
    isReported: query.isReported || false,
    needsAdminReview: query.needsAdminReview || false,
    isHidden: query.isHidden || false,
  };
};

export const apiService = {
  // --- FAQs ---
  async getFaqs(page = 1, limit = 100): Promise<Question[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<any>>(`/faqs?page=${page}&limit=${limit}`);
      return (response.data.data || []).map(mapFaqToQuestion);
    } catch (err) {
      console.error('Failed to get FAQs:', err);
      return [];
    }
  },
  async createFaq(question: string, answer: string): Promise<Question> {
    const response = await apiClient.post<ApiResponse<any>>('/faqs', { question, answer });
    return mapFaqToQuestion(response.data.data);
  },
  async updateFaq(id: string, question: string, answer: string): Promise<Question> {
    const response = await apiClient.patch<ApiResponse<any>>(`/faqs/${id}`, { question, answer });
    return mapFaqToQuestion(response.data.data);
  },
  async deleteFaq(id: string): Promise<void> {
    await apiClient.delete(`/faqs/${id}`);
  },

  // --- Queries ---
  async getQueries(isAdmin = false): Promise<Question[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<any>>('/queries?limit=100');
      const queries = response.data.data || [];

      // Always fetch replies for all queries so users can see answered ones
      return await Promise.all(
        queries.map(async (q: any) => {
          try {
            const repsResponse = await apiClient.get<ApiResponse<any[]>>(`/queries/${q._id}/replies`);
            return mapQueryToQuestion(q, repsResponse.data.data || []);
          } catch {
            // If replies fetch fails (e.g. non-admin on restricted endpoint), return query without replies
            return mapQueryToQuestion(q, []);
          }
        })
      );
    } catch (err) {
      console.error('Failed to get Queries:', err);
      return [];
    }
  },
  async createQuery(title: string, description: string): Promise<Question> {
    const response = await apiClient.post<ApiResponse<any>>('/queries', { title, description });
    return mapQueryToQuestion(response.data.data, []);
  },
  async addReply(queryId: string, content: string): Promise<Answer> {
    const response = await apiClient.post<ApiResponse<any>>(`/queries/${queryId}/replies`, { content });
    const rep = response.data.data;
    return {
      id: rep._id,
      questionId: queryId,
      author: {
        id: rep.userId || 'current',
        name: 'You',
        role: 'INTERN',
        avatar: '🦊',
        stats: { questionsAsked: 0, answersPosted: 0, upvotesReceived: 0, reputation: 0 },
        badges: [],
      },
      content: rep.content,
      isOfficial: false,
      isAccepted: false,
      createdAt: rep.createdAt,
    };
  },
  async approveReply(replyId: string): Promise<void> {
    await apiClient.post(`/replies/${replyId}/approve`);
  },
  async deleteReply(replyId: string): Promise<void> {
    await apiClient.delete(`/replies/${replyId}`);
  },
  async deleteQuery(id: string): Promise<void> {
    await apiClient.delete(`/queries/${id}`);
  },

  // --- Chat/RAG ---
  async askRAG(question: string): Promise<{ answer: string; sources: any[] }> {
    const response = await apiClient.post<ApiResponse<{ answer: string; sources: any[] }>>('/chat/ask', { question });
    return response.data.data;
  },
  async chatBot(question: string, sessionId?: string): Promise<{ answer: string; sources: any[]; sessionId: string }> {
    const response = await apiClient.post<ApiResponse<{ answer: string; sources: any[]; sessionId: string }>>('/chat/chatbot', { question, sessionId });
    return response.data.data;
  },
  async clearChatSession(sessionId: string): Promise<void> {
    await apiClient.post('/chat/chatbot/clear', { sessionId });
  },

  // --- Badges ---
  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`/badges/users/${userId}`);
      return response.data.data || [];
    } catch {
      return [];
    }
  },
  async getUserStats(userId: string): Promise<{ approvedReplies: number; totalQueries: number; resolvedQueries: number; totalReplies: number; approvalRate: number }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/badges/stats/${userId}`);
      return response.data.data;
    } catch {
      return { approvedReplies: 0, totalQueries: 0, resolvedQueries: 0, totalReplies: 0, approvalRate: 0 };
    }
  },
  async getLeaderboard(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/badges/leaderboard');
      return response.data.data || [];
    } catch {
      return [];
    }
  },

  // --- Auth ---
  async signIn(email: string, password: string): Promise<void> {
    await apiClient.post('/auth/sign-in/email', { email, password });
  },
  async signUp(name: string, email: string, password: string): Promise<void> {
    await apiClient.post('/auth/sign-up/email', { name, email, password });
  },
  async signInWithGoogle(): Promise<void> {
    const callbackURL = window.location.origin;
    const response = await apiClient.post('/auth/sign-in/social', {
      provider: 'google',
      callbackURL,
    });
    const redirectUrl = response.data?.url || response.data?.redirectURL;
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  },
  async forgotPassword(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/reset-password`;
    await apiClient.post('/auth/request-password-reset', { email, redirectTo });
  },
  async resetPassword(newPassword: string, token: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { newPassword, token });
  },
  async signOut(): Promise<void> {
    await apiClient.post('/auth/sign-out');
  },
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/auth/me');
      const dbUser = response.data.data;
      if (!dbUser) return null;

      const userId = dbUser.id || dbUser._id;

      const [statsData, badgesData] = await Promise.all([
        apiService.getUserStats(userId),
        apiService.getUserBadges(userId),
      ]);

      const badgeNames: string[] = badgesData.map((b: any) => b.badgeId?.name || b.name || 'Badge');

      return {
        id: userId,
        name: dbUser.name || 'User',
        role: mapRole(dbUser.role),
        avatar: dbUser.image || '🍒',
        stats: {
          questionsAsked: statsData.totalQueries,
          answersPosted: statsData.totalReplies,
          upvotesReceived: statsData.approvedReplies,
          reputation: Math.max(0, statsData.approvedReplies * 15 + statsData.totalQueries * 10 - (dbUser.reputationPenalty || 0)),
        },
        badges: badgeNames,
        warnings: dbUser.warnings || 0,
        reputationPenalty: dbUser.reputationPenalty || 0,
      };
    } catch {
      return null;
    }
  },
  // --- Moderation/Reporting ---
  async reportQuery(queryId: string, reason: string): Promise<void> {
    await apiClient.post(`/queries/${queryId}/report`, { reason });
  },
  async getReportedQueries(): Promise<Question[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/reported-queries');
    return (response.data.data || []).map((q: any) => mapQueryToQuestion(q, []));
  },
  async ignoreQuery(queryId: string): Promise<void> {
    await apiClient.post(`/admin/reported-queries/${queryId}/ignore`);
  },
  async warnQuery(queryId: string): Promise<void> {
    await apiClient.post(`/admin/reported-queries/${queryId}/warn`);
  },
  async penalizeQuery(queryId: string): Promise<void> {
    await apiClient.post(`/admin/reported-queries/${queryId}/penalize`);
  },
  async deleteReportedQuery(queryId: string): Promise<void> {
    await apiClient.delete(`/admin/reported-queries/${queryId}`);
  },
};
