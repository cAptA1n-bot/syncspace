'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const documentRoutes = require('./routes/document.routes');
const folderRoutes = require('./routes/folder.routes');
const shareRoutes = require('./routes/share.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');
const searchRoutes = require('./routes/search.routes');
const attachmentRoutes = require('./routes/attachment.routes');
const versionRoutes = require('./routes/version.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// ─── Connect Database ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// ─── Allowed Origins Helper ──────────────────────────────────────────────────
const getAllowedOrigins = () => {
  const envUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, ''))
    .filter(Boolean);
  return envUrls;
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/$/, '');
  const allowed = getAllowedOrigins();

  if (allowed.includes('*') || allowed.includes(cleanOrigin)) {
    return true;
  }

  // Check wildcard patterns (e.g. https://*.vercel.app)
  for (const item of allowed) {
    if (item.includes('*')) {
      const regex = new RegExp('^' + item.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      if (regex.test(cleanOrigin)) return true;
    }
  }

  // Allow all Vercel deployment & preview subdomains (*.vercel.app)
  if (/\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
};

// ─── Security middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", ...getAllowedOrigins(), 'https://*.vercel.app', 'wss:'],
    },
  },
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General middleware ──────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // prevent NoSQL injection

// HTTP logging (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ─── Global rate limiting ────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── API routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
