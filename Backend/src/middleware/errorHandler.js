// src/middleware/errorHandler.js
// ─────────────────────────────────────────────────────────────
// Centralised error handling.
//
// Usage in route handlers:
//   throw new AppError('Room not found', 404);
//
// Async route handlers must be wrapped with asyncHandler()
// or the error won't reach this middleware.
// ─────────────────────────────────────────────────────────────
'use strict';

const logger = require('../lib/logger');

class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;       // machine-readable error code for frontend
    this.isOperational = true; // vs programmer errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wraps async route handlers so errors propagate to errorHandler.
 * Usage: router.get('/rooms', asyncHandler(roomController.list))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Express error handler — must be registered LAST in app.js.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Supabase errors have a specific shape
  if (err.code === 'PGRST116') {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // Known operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  // Unknown errors — log and return generic message
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(500).json({ error: 'An internal error occurred' });
}

module.exports = { AppError, asyncHandler, errorHandler };
