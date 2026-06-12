import { connectDB } from './config/db';
import createApp from './app';
import { env } from './config/env';
import { logger } from './core/utils/logger';
import { initSocket } from './core/socket/socket';

const startServer = async (): Promise<void> => {
  // Connect to database first
  await connectDB();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(` Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Initialize Socket.IO
  initSocket(server);

  // ─── Graceful Shutdown ────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', reason);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', err);
    shutdown('uncaughtException');
  });
};

export default startServer;
