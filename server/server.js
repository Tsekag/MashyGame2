// server/server.js (ESM version)
import dotenv from 'dotenv';

// Load .env from project root
dotenv.config({ path: '../.env' });

// Require JWT secret explicitly (do not allow insecure fallback)
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Set it in your environment before starting the server.');
}

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection, initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/uploads.js';
import feedbackRoutes from './routes/feedback.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import { csrfProtection } from './middleware/csrf.js';

const app = express();
const PORT = process.env.PORT || 3001;
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Baseline security headers without additional dependencies.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// CSRF middleware (enforced for cookie-authenticated unsafe requests).
app.use('/api', csrfProtection);

// Serve uploaded files from both legacy and current directories.
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const serverUploadsDir = path.join(serverDir, 'uploads');
const legacyAppUploadsDir = path.resolve(serverDir, '..', 'uploads');
app.use('/uploads', express.static(serverUploadsDir), express.static(legacyAppUploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Mashup Game API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      error: 'File upload error',
      message: err.message,
    });
  }

  if (err?.message === 'Only image files are allowed') {
    console.error('Invalid image upload:', err.message);
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message,
    });
  }

  console.error('Server error:', err);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.all(/.*/, (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
async function startServer() {
  try {
    await testConnection();
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
