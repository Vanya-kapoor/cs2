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
 * Attaches the authenticated user to req.user if a valid session exists,
 * but does NOT throw if the request is unauthenticated. Useful for routes
 * that should behave differently for logged-in users (e.g. attributing a
 * query to its author) while still allowing anonymous access.
 */
export const attachUser = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const session = await getAuth().api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session?.user) {
      req.user = session.user as unknown as AuthUser;
    }

    next();
  },
);

/**
 * Requires that the authenticated user has one of the given roles.
 * Must be used after requireAuth.
 *
 * Two extra checks beyond the basic role check, each surfaced via a
 * `details.code` on the thrown ForbiddenError so the frontend can react
 * appropriately instead of showing a raw AxiosError:
 *
 *  - STALE_ROLE_SESSION: the user's cached session still has an old role
 *    (e.g. they were demoted in the DB but their better-auth session/cookie
 *    cache hasn't refreshed yet). The frontend should re-sync the session
 *    (or sign the user out) rather than retry the same request.
 *
 *  - EMAIL_VERIFICATION_REQUIRED: the user's role is admin but their email
 *    is not verified yet (e.g. they were just promoted to admin). The
 *    frontend should show a persistent banner prompting verification.
 */
export const requireRole = (...roles: Role[]) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role as Role)) {
      // If admin access is required but the cached session still shows a
      // non-admin role, the user may have just been demoted (or promoted)
      // and their session cookie cache hasn't refreshed yet.
      if (roles.includes(Roles.ADMIN)) {
        throw new ForbiddenError(
          `Forbidden – requires one of roles: ${roles.join(', ')}`,
          { code: 'STALE_ROLE_SESSION' },
        );
      }

      throw new ForbiddenError(
        `Forbidden – requires one of roles: ${roles.join(', ')}`,
      );
    }

    // Admin access requires a verified email. When a user is promoted to
    // admin, better-auth sends them a verification email. Until they verify,
    // they cannot exercise admin privileges.
    if (roles.includes(Roles.ADMIN) && req.user.role === Roles.ADMIN && !req.user.emailVerified) {
      throw new ForbiddenError(
        'Admin access requires a verified email address. Please check your inbox and verify your email to continue or resend the verification email.',
        { code: 'EMAIL_VERIFICATION_REQUIRED' },
      );
    }

    next();
  });