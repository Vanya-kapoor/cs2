import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { BaseController } from '../../core/base/BaseController';
import { getAuth } from '../../config/auth';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';
import { logger } from '../../core/utils/logger';

/**
 * AuthController mounts betterAuth handlers and provides custom endpoints.
 *
 * betterAuth built-in routes:
 *   POST   /api/auth/sign-up/email
 *   POST   /api/auth/sign-in/email
 *   POST   /api/auth/sign-out
 *   GET    /api/auth/session
 *   GET    /api/auth/oauth/google/authorize  (Google OAuth)
 *   GET    /api/auth/oauth/google/callback   (Google OAuth callback)
 *
 * Custom endpoints:
 *   GET    /api/auth/me                      (Get current user)
 *   POST   /api/auth/refresh                 (Refresh session)
 */
export class AuthController extends BaseController {
  private readonly betterAuthHandler = toNodeHandler(getAuth());

  constructor() {
    super();
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    // ─── Custom Endpoints (must come BEFORE wildcard) ───────────────────

    /**
     * GET /api/auth/me
     * Returns the current authenticated user's profile
     */
    this.router.get(
      '/me',
      requireAuth,
      asyncHandler(this.getCurrentUser.bind(this)),
    );

    /**
     * POST /api/auth/refresh
     * Refresh the current session
     */
    this.router.post(
      '/refresh',
      requireAuth,
      asyncHandler(this.refreshSession.bind(this)),
    );

    /**
     * POST /api/auth/check-email
     * Check if email is already registered (public endpoint)
     */
    this.router.post(
      '/check-email',
      asyncHandler(this.checkEmailExists.bind(this)),
    );

    // ─── betterAuth Handler (wildcard catch-all) ────────────────────────
    this.router.use(this.betterAuthHandler);
  }

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user
   */
  private async getCurrentUser(
    req: Request,
    res: Response,
  ): Promise<void> {
    logger.info(`User profile accessed: ${req.user?.id}`);
    sendSuccess(res, {
      user: req.user,
      message: 'User profile retrieved successfully',
    });
  }

  /**
   * POST /api/auth/refresh
   * Refreshes the current session and returns updated session data
   */
  private async refreshSession(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const auth = getAuth();
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      if (!session?.user) {
        logger.warn('Session refresh failed: no valid session');
        sendSuccess(res, { session: null });
        return;
      }

      logger.info(`Session refreshed for user: ${session.user.id}`);
      sendSuccess(res, {
        session,
        message: 'Session refreshed successfully',
      });
    } catch (error) {
      logger.error('Session refresh error', error);
      sendSuccess(res, { session: null });
    }
  }

  /**
   * POST /api/auth/check-email
   * Checks if an email is already registered in the system
   *
   * Request body:
   * {
   *   "email": "user@example.com"
   * }
   */
  private async checkEmailExists(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      sendSuccess(res, {
        exists: false,
        message: 'Email is required',
      });
      return;
    }

    try {
      const auth = getAuth();
      // Query MongoDB directly to check if email exists
      const db = auth.adapter.db;
      const user = await db.user.findOne({ email });

      const exists = !!user;
      logger.debug(`Email check for ${email}: ${exists}`);

      sendSuccess(res, {
        exists,
        message: exists ? 'Email is already registered' : 'Email is available',
      });
    } catch (error) {
      logger.error('Email check error', error);
      sendSuccess(res, {
        exists: false,
        message: 'Unable to check email availability',
      });
    }
  }
}
