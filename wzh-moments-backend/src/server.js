import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import bidRoutes from './routes/bids.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import userRequestRoutes from './routes/userRequests.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/upload.js';
import reviewRoutes from './routes/reviews.js';
import errorHandler from './middleware/errorHandler.js';

// ─── Uncaught exception guard ────────────────────────────────────────────────
// Must be registered before anything else so startup errors are caught cleanly.
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — shutting down:', err.message);
  process.exit(1);
});

// ─── Database ─────────────────────────────────────────────────────────────────
await connectDB();

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.use(mongoSanitize());

// Strict limiter for auth endpoints — prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// General rate limiter: 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', generalLimiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    //origin: process.env.FRONTEND_URL.split,
    origin: [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://wzhmoments.online',
  'https://www.wzhmoments.online',
  process.env.FRONTEND_URL,
] ,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HTTP request logging (development only) ──────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user-requests', userRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ─── HTTP server + Socket.IO ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log('✅ Socket.IO initialised and ready');
});

// Unhandled promise rejections — close server gracefully before exiting.
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION — shutting down:', err.message);
  httpServer.close(() => process.exit(1));
});

export default app;
