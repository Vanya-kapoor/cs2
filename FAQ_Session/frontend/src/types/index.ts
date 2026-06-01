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
}

export interface Answer {
  id: string;
  questionId: string;
  author: User;
  content: string;
  upvotes: number;
  isOfficial: boolean;
  isAccepted: boolean;
  createdAt: string;
}

export type QuestionStatus = 'OPEN' | 'ANSWERED' | 'ESCALATED' | 'UNDER_REVIEW' | 'RESOLVED';

export interface Question {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  upvotes: number;
  views: number;
  isOfficial: boolean;
  isAccepted: boolean;
  status: QuestionStatus;
  followers: number;
  needsAttention: boolean;
  createdAt: string;
  author: User;
  answers: Answer[];
  bookmarkedBy: string[]; // User IDs who bookmarked this
  followedBy: string[]; // User IDs who followed this
  upvotedBy: string[]; // User IDs who upvoted this
}

export interface FAQ {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  views: number;
  isOfficial: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'ANSWER_RECEIVED' | 'ANSWER_ACCEPTED' | 'ESCALATED' | 'OFFICIAL_ANSWER';
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  questionId: string;
}
