// backend/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { workspaceRouter } from './routes/workspaces';
import { reviewRouter } from './routes/reviews';
import { documentRouter } from './routes/documents';
import { bugRouter } from './routes/bugs';
import { activityRouter } from './routes/activity';
import { notificationRouter } from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';
import { setupSocket } from './lib/socket';

const app = express();
const httpServer = createServer(app);

// Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

setupSocket(io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// AI endpoints have stricter rate limiting
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI rate limit exceeded. Please wait before making more requests.' },
});
app.use('/api/reviews/analyze', aiLimiter);
app.use('/api/documents/generate', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/documents', documentRouter);
app.use('/api/bugs', bugRouter);
app.use('/api/activity', activityRouter);
app.use('/api/notifications', notificationRouter);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 DevMind API running on http://localhost:${PORT}`);
});

export default app;
