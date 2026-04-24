// src/lib/logger.js
// ─────────────────────────────────────────────────────────────
// Structured logger. In production logs JSON (Render ingests it).
// In dev logs pretty-printed with colours.
// ─────────────────────────────────────────────────────────────
'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const devFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? '\n' + JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

const prodFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json()
);

const logger = createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: config.isDev ? devFormat : prodFormat,
  transports: [new transports.Console()],
});

module.exports = logger;
