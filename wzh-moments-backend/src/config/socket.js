import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/** Module-level io reference so getIO() can be called from anywhere. */
let io = null;

/**
 * Initialises the Socket.IO server, wires authentication middleware, and
 * registers all connection/room event handlers.
 *
 * @param {import('http').Server} httpServer - The Node.js HTTP server
 * @returns {import('socket.io').Server}
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      //origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      origin: [['http://localhost:5173', 'http://127.0.0.1:5173']],  // Allow all origins for testing; replace with specific URL(s) in production
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication middleware ─────────────────────────────────────────────
  // Runs before every connection is established.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return next(new Error('Invalid token'));
      }

      const user = await User.findById(decoded.id).select('name email role');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Socket auth error:', err.message);
      }
      next(new Error('Authentication failed'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.user.name} (${socket.user.id})`);

    // Every user has a personal room for targeted notifications
    socket.join(`user-${socket.user.id}`);

    socket.emit('connected', {
      userId: socket.user.id,
      userName: socket.user.name,
      timestamp: new Date(),
    });

    // ── join-event ──────────────────────────────────────────────────────────
    socket.on('join-event', ({ eventId } = {}) => {
      if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
        socket.emit('error', { message: 'Invalid event ID' });
        return;
      }

      const room = `event-${eventId}`;
      socket.join(room);

      const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;

      io.to(room).emit('user-joined', {
        eventId,
        userId: socket.user.id,
        userName: socket.user.name,
        connectedUsers: roomSize,
        timestamp: new Date(),
      });

      console.log(`👤 ${socket.user.name} joined event room: ${eventId}`);
    });

    // ── leave-event ─────────────────────────────────────────────────────────
    socket.on('leave-event', ({ eventId } = {}) => {
      if (!eventId) return;

      const room = `event-${eventId}`;
      socket.leave(room);

      const roomSize = io.sockets.adapter.rooms.get(room)?.size ?? 0;

      io.to(room).emit('user-left', {
        eventId,
        userId: socket.user.id,
        userName: socket.user.name,
        connectedUsers: roomSize,
        timestamp: new Date(),
      });

      console.log(`👋 ${socket.user.name} left event room: ${eventId}`);
    });

    // ── join-chat ───────────────────────────────────────────────────────────
    socket.on('join-chat', ({ eventId } = {}) => {
      if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) {
        socket.emit('error', { message: 'Invalid event ID' });
        return;
      }
      socket.join(`chat-${eventId}`);
      console.log(`💬 ${socket.user.name} joined chat-${eventId}`);
    });

    // ── leave-chat ──────────────────────────────────────────────────────────
    socket.on('leave-chat', ({ eventId } = {}) => {
      if (!eventId) return;
      socket.leave(`chat-${eventId}`);
      console.log(`💬 ${socket.user.name} left chat-${eventId}`);
    });

    // ── chat:typing ─────────────────────────────────────────────────────────
    socket.on('chat:typing', ({ eventId, isTyping } = {}) => {
      if (!eventId || !/^[a-f\d]{24}$/i.test(eventId)) return;
      socket.to(`chat-${eventId}`).emit('chat:typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });

    // ── disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.user.name}`);
      // Socket.IO automatically removes the socket from all rooms on disconnect
    });
  });

  return io;
};

/**
 * Returns the active Socket.IO instance.
 * Must be called after initSocket().
 *
 * @returns {import('socket.io').Server}
 * @throws {Error} If Socket.IO has not been initialised yet
 */
export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized. Call initSocket() first.');
  return io;
};
