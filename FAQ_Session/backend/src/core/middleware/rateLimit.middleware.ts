import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../errors';
import { env } from '../../config/env';
import { logger } from '../utils/logger';

/**
 * Custom handler that funnels rate-limit hits into the centralised
 * error middleware via `next(err)` instead of sending a raw response.
 * This keeps the 429 response format identical to every other AppError.
 */
const rateLimitHandler = (req: Request, _res: Response, next: NextFunction): void => {
  logger.warn(`Rate limit exceeded for IP ${req.ip} on ${req.method} ${req.originalUrl}`);
  next(new TooManyRequestsError());
};

/**
 * Key generator — prefers the authenticated user ID so each logged-in user
 * gets their own independent bucket regardless of shared IPs (university
 * networks, VPNs, NAT). Falls back to the real client IP for unauthenticated
 * requests (e.g. sign-in attempts, public FAQ reads).
 *
 * req.ip is reliable here because app.set('trust proxy', 1) is set in
 * app.ts, which makes Express read X-Forwarded-For correctly behind Nginx /
 * Render / Railway / Cloudflare. The ::ffff: strip handles the IPv4-mapped
 * IPv6 address that Node emits on dual-stack localhost.
 */
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;

  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown')}`;
};

// ─── Global Rate Limiter ─────────────────────────────────────────────────────
// Applied to every route. Generous limit — protects against bots/scrapers
// while not impacting normal usage (a full page load fires ~10 requests).
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,        // default: 15 min
  max: env.RATE_LIMIT_MAX,                   // default: 100
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'development', // disable globally in dev
});

// ─── Auth Routes Limiter (brute-force protection) ────────────────────────────
// Tight limit on sign-in/sign-up — only ever hit by form submissions.
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,   // default: 15 min
  max: env.AUTH_RATE_LIMIT_MAX,              // default: 15
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'development',
});

// ─── Chat / RAG Routes Limiter (protects Gemini API costs) ──────────────────
// Per-minute cap to prevent runaway LLM spending.
export const chatLimiter = rateLimit({
  windowMs: env.CHAT_RATE_LIMIT_WINDOW_MS,   // default: 1 min
  max: env.CHAT_RATE_LIMIT_MAX,              // default: 5
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  // Chat limiter stays active in dev so LLM costs are always protected
});

// ─── Query Submission Limiter (anti-spam for public write endpoint) ──────────
// Only applies to POST /api/queries (creating a new query).
// GET requests (listing queries / fetching replies) are excluded — they fire
// on every page load and would be hit constantly at limit=5.
export const queryLimiter = rateLimit({
  windowMs: env.QUERY_RATE_LIMIT_WINDOW_MS,  // default: 15 min
  max: env.QUERY_RATE_LIMIT_MAX,             // default: 5
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req) =>
    req.method !== 'POST' || env.NODE_ENV === 'development',
});
