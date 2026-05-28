import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../../config/auth';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { Role } from '../constants/roles';
import { asyncHandler } from '../utils/asyncHandler';
import type { AuthUser } from '../types/express';
import { logger } from '../utils/logger';

/**
 * Validates the betterAuth session and attaches user to req.user.
 * Thrown UnauthorizedError if session is invalid or missing.
 */
export const requireAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await getAuth().api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session?.user) {
        logger.warn('Authentication required but no valid session found');
        throw new UnauthorizedError(
          'Authentication required. Please sign in first.',
        );
      }

      // Map betterAuth user to our AuthUser shape
      req.user = session.user as unknown as AuthUser;
      logger.debug(`User authenticated: ${req.user.id}`);
      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      logger.error('Session validation error', error);
      throw new UnauthorizedError('Invalid or expired session');
    }
  },
);

/**
 * Requires that the authenticated user has one of the given roles.
 * Must be used AFTER requireAuth middleware.
 *
 * @example
 * ```ts
 * router.delete('/admin-only', requireAuth, requireRole(Roles.ADMIN), handler);
 * ```
 */
export const requireRole = (...roles: Role[]) =>
  asyncHandler(
    async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        logger.warn('Role check attempted without authentication');
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role as Role)) {
        logger.warn(
          `User ${req.user.id} attempted to access resource requiring roles: ${roles.join(', ')}. User role: ${req.user.role}`,
        );
        throw new ForbiddenError(
          `Access denied. This action requires one of: ${roles.join(', ')}`,
        );
      }

      logger.debug(`User ${req.user.id} passed role check for: ${roles.join(', ')}`);
      next();
    },
  );

/**
 * Optional authentication middleware.
 * Attaches user to req.user if authenticated, but doesn't throw if not.
 * Useful for endpoints that have different behavior for authenticated vs. unauthenticated users.
 */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await getAuth().api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (session?.user) {
        req.user = session.user as unknown as AuthUser;
        logger.debug(`Optional auth: user authenticated ${req.user.id}`);
      } else {
        logger.debug('Optional auth: no valid session, continuing as guest');
      }

      next();
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth check failed, continuing as guest');
      next();
    }
  },
);
