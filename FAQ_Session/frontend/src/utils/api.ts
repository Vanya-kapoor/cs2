import axios from 'axios';
import { Question, Answer, User, QuestionStatus } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Default system author for official FAQs
const systemAdminUser: User = {
  id: '60d5ec49f8cb2d3e1858a8a4',
  name: 'Vicharanashala Lab',
  role: 'ADMIN',
  avatar: '🎓',
  stats: {
    questionsAsked: 0,
    answersPosted: 50,
    upvotesReceived: 200,
    reputation: 1000,
  },
  badges: ['Official Lab', 'Mentor'],
};

// Generic type for standard backend response wrapping
interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

interface PaginatedData<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
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

// Map backend FAQ to frontend Question
export const mapFaqToQuestion = (faq: any): Question => {
  return {
    id: faq._id,
    title: faq.question,
    description: 'Official verified FAQ answer.',
    category: faq.category || 'General',
    tags: faq.tags || ['faq', 'official'],
    upvotes: faq.upvotes || 0,
    views: faq.views || 0,
    isOfficial: true,
    isAccepted: true,
    status: 'RESOLVED',
    followers: 1,
    needsAttention: false,
    createdAt: faq.createdAt || new Date().toISOString(),
    author: systemAdminUser,
    upvotedBy: [],
    bookmarkedBy: [],
    followedBy: [],
    answers: [
      {
        id: `${faq._id}_ans`,
        questionId: faq._id,
        author: systemAdminUser,
        content: faq.answer,
        upvotes: faq.upvotes || 0,
        isOfficial: true,
        isAccepted: true,
        createdAt: faq.createdAt || new Date().toISOString(),
      },
    ],
  };
};

// Map backend Query & its Replies to frontend Question
export const mapQueryToQuestion = (query: any, replies: any[] = []): Question => {
  const mappedAnswers: Answer[] = replies.map((rep) => ({
    id: rep._id,
    questionId: query._id,
    author: {
      id: rep.userId?._id || rep.userId || 'user',
      name: rep.userId?.name || 'Intern Contributor',
      role: rep.userId?.role?.toUpperCase() || 'INTERN',
      avatar: '🦊',
      stats: { questionsAsked: 1, answersPosted: 2, upvotesReceived: 10, reputation: 50 },
      badges: [],
    },
    content: rep.content,
    upvotes: 0,
    isOfficial: rep.userId?.role === 'admin' || rep.userId?.role === 'mentor',
    isAccepted: rep.isApproved,
    createdAt: rep.createdAt,
  }));

  const hasAccepted = mappedAnswers.some(ans => ans.isAccepted);

  return {
    id: query._id,
    title: query.title,
    description: query.description || '',
    category: query.category || 'General',
    tags: query.tags || ['query'],
    upvotes: query.upvotes || 0,
    views: query.views || 0,
    isOfficial: false,
    isAccepted: hasAccepted,
    status: (hasAccepted ? 'RESOLVED' : (query.status === 'resolved' ? 'ANSWERED' : 'OPEN')) as QuestionStatus,
    followers: 1,
    needsAttention: query.status === 'pending',
    createdAt: query.createdAt,
    author: {
      id: query.createdBy?._id || query.createdBy || 'anonymous',
      name: query.createdBy?.name || 'Anonymous Intern',
      role: 'INTERN',
      avatar: '🧑‍💻',
      stats: { questionsAsked: 1, answersPosted: 0, upvotesReceived: 0, reputation: 10 },
      badges: [],
    },
    answers: mappedAnswers,
    upvotedBy: [],
    bookmarkedBy: [],
    followedBy: [],
  };
};

// API Services object
export const apiService = {
  // --- FAQs Services ---
  async getFaqs(page = 1, limit = 100): Promise<Question[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<any>>(
        `/faqs?page=${page}&limit=${limit}`
      );
      const results = response.data.data || [];
      return results.map(mapFaqToQuestion);
    } catch (err) {
      console.error('Failed to get FAQs from backend:', err);
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

  // --- Queries & Answers Services ---
  async getQueries(): Promise<Question[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<any>>('/queries?limit=100');
      const queries = response.data.data || [];
      
      const mappedQueries = await Promise.all(
        queries.map(async (q) => {
          try {
            const repsResponse = await apiClient.get<ApiResponse<any[]>>(`/queries/${q._id}/replies`);
            return mapQueryToQuestion(q, repsResponse.data.data);
          } catch {
            return mapQueryToQuestion(q, []);
          }
        })
      );
      return mappedQueries;
    } catch (err) {
      console.error('Failed to get Queries from backend:', err);
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
        stats: { questionsAsked: 1, answersPosted: 1, upvotesReceived: 0, reputation: 10 },
        badges: [],
      },
      content: rep.content,
      upvotes: 0,
      isOfficial: false,
      isAccepted: false,
      createdAt: rep.createdAt,
    };
  },

  async approveReply(replyId: string): Promise<void> {
    await apiClient.post(`/replies/${replyId}/approve`);
  },

  async deleteQuery(id: string): Promise<void> {
    await apiClient.delete(`/queries/${id}`);
  },

  // --- Chat & RAG Services ---
  async askRAG(question: string): Promise<{ answer: string; sources: any[] }> {
    const response = await apiClient.post<ApiResponse<{ answer: string; sources: any[] }>>(
      '/chat/ask',
      { question }
    );
    return response.data.data;
  },

  async chatBot(question: string, sessionId?: string): Promise<{ answer: string; sources: any[]; sessionId: string }> {
    const response = await apiClient.post<ApiResponse<{ answer: string; sources: any[]; sessionId: string }>>(
      '/chat/chatbot',
      { question, sessionId }
    );
    return response.data.data;
  },

  async clearChatSession(sessionId: string): Promise<void> {
    await apiClient.post('/chat/chatbot/clear', { sessionId });
  },

  // --- User Authentication ---
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/auth/me');
      const dbUser = response.data.data;
      if (!dbUser) return null;
      return {
        id: dbUser.id || dbUser._id,
        name: dbUser.name || 'Guneet Toppo',
        role: (dbUser.role || 'INTERN').toUpperCase() as any,
        avatar: dbUser.image || '🍒',
        stats: {
          questionsAsked: 4,
          answersPosted: 10,
          upvotesReceived: 20,
          reputation: 150,
        },
        badges: dbUser.role === 'admin' ? ['FAQ Expert'] : ['First Question'],
      };
    } catch {
      return null;
    }
  },
};
