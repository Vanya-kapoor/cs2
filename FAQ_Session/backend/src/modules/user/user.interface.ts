import mongoose, { Document } from 'mongoose';
import { Role } from '../../core/constants/roles';

export interface IUserBadge {
  badgeId: mongoose.Schema.Types.ObjectId;
  earnedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  image?: string;
  badges: IUserBadge[];
  createdAt: Date;
  updatedAt: Date;
}

