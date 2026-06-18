export type UserRole = 'ADMIN' | 'INTERN';

export interface UserStats {
  questionsAsked: number;
  answersPosted: number;
  upvotesReceived: number;
  reputation: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  emailVerified?: boolean;
  avatar: string;
  stats: UserStats;
  badges: string[];
}

export interface Answer {
  id: string;
  questionId: string;
  author: User;
  content: string;
  isOfficial: boolean;
  isAccepted: boolean;
  createdAt: string;
}

export type QuestionStatus = 'OPEN' | 'ANSWERED' | 'RESOLVED';

export interface Question {
  id: string;
  title: string;
  description: string;
  tags: string[];
  isOfficial: boolean;
  isAccepted: boolean;
  status: QuestionStatus;
  createdAt: string;
  author: User;
  answers: Answer[];
  /**
   * Set on queries that have been promoted to FAQ.
   * Used by the admin dashboard to show "View FAQ" instead of "Promote to FAQ".
   */
  linkedFaqId?: string | null;
}
