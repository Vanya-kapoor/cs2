import { Session } from 'better-auth';
import { Role } from '../constants/roles';

import 'express';

/**
 * Represents an authenticated user attached to the request object.
 * Set by requireAuth middleware from betterAuth session.
 */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  role: 'student' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  // Custom fields from our user schema
  profileImageUrl?: string | null;
  lastLoginAt?: Date;
}

declare global {
  namespace Express {
    interface Request {
      /**
       * Current authenticated user (set by requireAuth middleware).
       * undefined if user is not authenticated.
       */
      user?: AuthUser;
    }
  }
}

export {};
