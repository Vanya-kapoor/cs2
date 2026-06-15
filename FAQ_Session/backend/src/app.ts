import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { AuthController } from './modules/auth/auth.controller';
import { FaqController } from './modules/faq/faq.controller';
import { QueryController } from './modules/query/query.controller';
import { ReplyController } from './modules/reply/reply.controller';
import { ChatController } from './modules/chat/chat.controller';
import { AdminUserController } from './modules/admin/admin.controller';
import badgeRoutes from './modules/badge/badge.routes';
import notificationRoutes from './modules/notification/notification.routes';
import { errorMiddleware } from './core/middleware/error.middleware';
import { notFoundMiddleware } from './core/middleware/notFound.middleware';
import { logger } from './core/utils/logger';
import { globalLimiter, authLimiter, chatLimiter, queryLimiter } from './core/middleware/rateLimit.middleware';

const createApp = (): Application => {
  const app = express();

  // ─── Global Middleware ────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ─── Rate Limiting ──────────────────────────────────────────────────
  app.use(globalLimiter);

  // ─── Health Check ─────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  // ─── Module Routes ────────────────────────────────────────────────────
  const authController = new AuthController();
  const faqController = new FaqController();
  const queryController = new QueryController();
  const replyController = new ReplyController();
  const chatController = new ChatController();
  const adminUserController = new AdminUserController();

  /**
   * better-auth handles all /api/auth/* sub-routes internally.
   * Built-in routes include:
   *   POST /api/auth/sign-up/email
   *   POST /api/auth/sign-in/email
   *   POST /api/auth/sign-out
   *   GET  /api/auth/session
   */
  app.use('/api/auth', authLimiter, authController.router);

  /**
   * FAQ routes (public read, admin write):
   *   GET    /api/faqs              – list all FAQs (public)
   *   GET    /api/faqs/:id          – get single FAQ (public)
   *   POST   /api/faqs              – admin directly creates FAQ (admin)
   *   PATCH  /api/faqs/:id          – update FAQ (admin)
   *   DELETE /api/faqs/:id          – delete FAQ (admin)
   */
  app.use('/api/faqs', faqController.router);

  /**
   * Query routes (public submit, admin manage):
   *   POST   /api/queries           – raise a query (public, unauthenticated)
   *   GET    /api/queries           – list all queries (admin)
   *   GET    /api/queries/:id       – get single query (admin)
   *   DELETE /api/queries/:id       – delete query (admin)
   */
  app.use('/api/queries', queryLimiter, queryController.router);

  /**
   * Reply routes (authenticated reply, admin approve):
   *   POST   /api/queries/:queryId/replies  – reply to a query (authenticated)
   *   GET    /api/queries/:queryId/replies  – list replies for query (admin)
   *   POST   /api/replies/:id/approve       – approve reply → creates FAQ (admin)
   */
  app.use('/api', replyController.router);

  app.use('/api/chat', chatLimiter, chatController.router);
  app.use('/api/badges', badgeRoutes);
  app.use('/api/notifications', notificationRoutes);

  /**
   * Admin – user management:
   *   GET   /api/admin/users          – list users (admin)
   *   PATCH /api/admin/users/:id/role – change a user's role (admin),
   *                                      revokes that user's sessions so the
   *                                      change takes effect immediately
   */
  app.use('/api/admin', adminUserController.router);

  // ─── 404 & Error Handlers ─────────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  logger.info('Express app configured');
  return app;
};

export default createApp;
