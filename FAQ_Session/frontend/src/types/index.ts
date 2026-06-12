export type UserRole = 'ADMIN' | 'INTERN' | 'MENTOR';

export interface UserStats {
  questionsAsked: number;
  answersPosted: number;
  upvotesReceived: number;
  reputation: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  stats: UserStats;
  badges: string[];
  warnings?: number;
  reputationPenalty?: number;
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
  reportCount?: number;
  isReported?: boolean;
  needsAdminReview?: boolean;
  isHidden?: boolean;
}
