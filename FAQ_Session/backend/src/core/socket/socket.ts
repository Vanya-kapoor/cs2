import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../../config/auth';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

let io: SocketIOServer;

// Map to keep track of user connections
// Key: userId, Value: Set of socketIds
const userSockets = new Map<string, Set<string>>();

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      // Authenticate using better-auth
      // Check cookies specifically for better-auth
      const session = await getAuth().api.getSession({
        headers: fromNodeHeaders(socket.request.headers as any),
      });

      if (!session?.user) {
        return next(new Error('Authentication error: Invalid session'));
      }

      (socket as any).user = session.user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user.id;

    logger.info(`Socket connected: ${socket.id} for user ${userId}`);

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} for user ${userId}`);
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  const socketIds = userSockets.get(userId);
  if (socketIds && io) {
    socketIds.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
  }
};
