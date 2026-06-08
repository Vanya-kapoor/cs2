import { Document } from 'mongoose';

export enum BadgeCategory {
  CONTRIBUTION = 'contribution',
  QUERY = 'query',
  RESOLUTION = 'resolution',
  LEADERBOARD = 'leaderboard',
}

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: number; // e.g., 5 for "5 approved replies"
  createdAt: Date;
  updatedAt: Date;
}
