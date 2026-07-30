// src/app.js
// ─────────────────────────────────────────────────────────────
// Express application factory.
// server.js calls createApp() then starts listening.
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

const roomRoutes         = require('./modules/rooms/route');
const bookingRoutes      = require('./modules/bookings/router');
const paymentRoutes      = require('./modules/payments/router');
const receiptRoutes      = require('./modules/receipts/router');
const adminRoutes        = require('./modules/admin/admin.routes');
const notificationRoutes = require('./modules/notifications/router');

function createApp() {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (config.cors.allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      // Reject with a specific error to be handled by errorHandler
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));

 app.use(express.json({
    limit: '10kb',
    verify: (req, res, buf) => { req.rawBody = buf; },
  }));
  app.use(express.urlencoded({ extended: false }));
  app.use(compression());

  app.use(morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/health',
  }));

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  }));

  app.use('/api/payments/poll', rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many payment checks' },
  }));

  app.get('/health', (req, res) => res.json({ status: 'ok', env: config.env }));

  app.use('/api/rooms',         roomRoutes);
  app.use('/api/bookings',      bookingRoutes);
  app.use('/api/payments',      paymentRoutes);
  app.use('/api/receipts',      receiptRoutes);
  app.use('/api/admin',         adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  // ✅ FIX: /debug/redis route removed — was unauthenticated and exposes internals
  app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
