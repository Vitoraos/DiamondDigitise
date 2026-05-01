// src/app.js
// ─────────────────────────────────────────────────────────────
// Express application factory.
// server.js calls createApp() then starts listening.
// Keeping them separate makes testing cleaner — tests import
// createApp() directly without binding to a port.
// ─────────────────────────────────────────────────────────────
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./lib/logger');
const { errorHandler } = require('./middleware/errorHandler');

// ── Route modules (Phase 2+ will fill these in) ──────────────
const roomRoutes       = require('./modules/rooms/route');
const bookingRoutes    = require('./modules/bookings/router');
const paymentRoutes    = require('./modules/payments/router');
const receiptRoutes    = require('./modules/receipts/router');
const adminRoutes      = require('./modules/admin/admin.routes');
const notificationRoutes = require('./modules/notifications/router');

function createApp() {
  const app = express();

  // ── Security headers ───────────────────────────────────────
  app.use(helmet());

  // ── CORS ───────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return cb(null, true);
      if (config.cors.allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }));

  // ── Body parsing ───────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false }));

  // ── Compression ────────────────────────────────────────────
  app.use(compression());

  // ── Request logging ────────────────────────────────────────
  app.use(morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/health',
  }));

  // ── Global rate limit ──────────────────────────────────────
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }));

  // ── Payment polling — tighter limit ────────────────────────
  app.use('/api/payments/poll', rateLimit({
    windowMs: 60 * 1000,
    max: 30,   // 30 polls per minute (5s interval = 12 max, headroom for retries)
    message: { error: 'Too many payment checks' },
  }));

  // ── Health check ───────────────────────────────────────────
  app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));

  // ── API routes ─────────────────────────────────────────────
  app.use('/api/rooms',         roomRoutes);
  app.use('/api/bookings',      bookingRoutes);
  app.use('/api/payments',      paymentRoutes);
  app.use('/api/receipts',      receiptRoutes);
  app.use('/api/admin',         adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  // ── 404 handler ────────────────────────────────────────────
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

  // ── Global error handler (must be last) ────────────────────
  app.use(errorHandler);

  // TEMP: src/app.js
  app.get('/debug/redis', async (req, res) => {
    const Redis = require('ioredis');
    const client = new Redis(process.env.REDIS_URL);
    try {
      await client.ping();
      res.json({ connected: true, message: 'Redis OK' });
    } catch (err) {
      res.status(500).json({ connected: false, error: err.message });
    } finally {
      await client.quit();
  }
});
  
  return app;
}

module.exports = { createApp };
