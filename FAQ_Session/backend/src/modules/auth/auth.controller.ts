import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';

import { BaseController } from '../../core/base/BaseController';
import { getAuth } from '../../config/auth';
import { requireAuth } from '../../core/middleware/auth.middleware';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { sendSuccess } from '../../core/utils/response';
import { Messages } from '../../core/constants/messages';

/**
 * ── Email / password ──────────────────────────────────────────────────
 *   POST /api/auth/sign-up/email        body: { name, email, password }
 *   POST /api/auth/sign-in/email        body: { email, password }
 *   POST /api/auth/sign-out
 *   GET  /api/auth/get-session
 *
 * ── Forgot / reset password ───────────────────────────────────────────
 *   POST /api/auth/request-password-reset      body: { email, redirectTo }
 *   POST /api/auth/reset-password       body: { newPassword, token }
 *
 * ── Google OAuth ──────────────────────────────────────────────────────
 *   POST /api/auth/sign-in/social       body: { provider: "google", callbackURL }
 *   GET  /api/auth/callback/google
 *
 * ── Email verification (admin promotion only) ─────────────────────────
 *   POST /api/auth/send-verification-email
 *   GET  /api/auth/verify-email
 *
 * ── Custom ────────────────────────────────────────────────────────────
 *   GET  /api/auth/me
 */
export class AuthController extends BaseController {
  private readonly betterAuthHandler = toNodeHandler(getAuth());

  constructor() {
    super();
    this.registerRoutes();
  }

  protected registerRoutes(): void {
    this.router.get('/me', requireAuth, asyncHandler(this.me.bind(this)));
    this.router.all('*', this.betterAuthHandler);
  }

  private async me(req: Request, res: Response): Promise<void> {
    sendSuccess(res, req.user, Messages.SUCCESS);
  }
}