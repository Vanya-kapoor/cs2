import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../../config/auth';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { Role, Roles } from '../constants/roles';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthUser } from '../types/express';

/**
 * Validates the better-auth session and attaches user to req.user.
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Map better-auth user to our AuthUser shape
    req.user = session.user as unknown as AuthUser;
    next();
  },
);

/**
 * Requires that the authenticated user has one of the given roles.
 * Must be used after requireAuth.
 *
 * Admin gate: if admin role is required, the user must also have a verified
 * email. This covers the case where someone is promoted to admin but never
 * clicks the verification link — they stay locked out of admin routes until
 * they do.
 */
export const requireRole = (...roles: Role[]) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role as Role)) {
      throw new ForbiddenError(
        `Forbidden – requires one of roles: ${roles.join(', ')}`,
      );
    }

    // Admin access requires a verified email. When a user is promoted to
    // admin, better-auth sends them a verification email. Until they verify,
    // they cannot exercise admin privileges.
    if (roles.includes(Roles.ADMIN) && req.user.role === Roles.ADMIN && !req.user.emailVerified) {
      throw new ForbiddenError(
        'Admin access requires a verified email address. Please check your inbox and verify your email to continue or send the verifiction email.',
      );
    }

    next();
  });