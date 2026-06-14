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
  role: UserRole;
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
}
