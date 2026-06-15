import rateLimit from 'express-rate-limit';
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

// ─── Global Rate Limiter ────────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable `X-RateLimit-*` headers
  handler: rateLimitHandler,
});

// ─── Auth Routes Limiter (brute-force protection) ───────────────────────
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── Chat / RAG Routes Limiter (protects Gemini API costs) ──────────────
export const chatLimiter = rateLimit({
  windowMs: env.CHAT_RATE_LIMIT_WINDOW_MS,
  max: env.CHAT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─── Query Submission Limiter (anti-spam for public endpoint) ───────────
export const queryLimiter = rateLimit({
  windowMs: env.QUERY_RATE_LIMIT_WINDOW_MS,
  max: env.QUERY_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
