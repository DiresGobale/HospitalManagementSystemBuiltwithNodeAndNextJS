import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { TokenPayload } from '../middleware/auth.js';

let ioServer: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer) {
  ioServer = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  ioServer.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      if (socket.handshake.query?.publicDisplay === 'true') {
        return next();
      }
      return next(new Error('Authentication required for WebSocket connection.'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
      (socket as any).user = decoded;
      return next();
    } catch (err) {
      return next(new Error('Invalid token for WebSocket connection.'));
    }
  });

  ioServer.on('connection', (socket: Socket) => {
    socket.on('join:clinic', async (data: { clinicId: string }) => {
      const { clinicId } = data;
      if (!clinicId) return;

      const user = (socket as any).user;
      if (user) {
        const membership = await prisma.clinicMembership.findFirst({
          where: { clinicId, userId: user.userId, status: 'ACTIVE' },
        });

        if (membership) {
          socket.join(`clinic:${clinicId}`);
        }
      }
    });

    socket.on('join:queue-session', async (data: { clinicId: string; sessionId: string }) => {
      const { clinicId, sessionId } = data;
      if (!clinicId || !sessionId) return;

      const session = await prisma.queueSession.findFirst({
        where: { id: sessionId, clinicId },
      });

      if (session) {
        socket.join(`clinic:${clinicId}:session:${sessionId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  return ioServer;
}

export function getSocketServer(): SocketIOServer | null {
  return ioServer;
}

