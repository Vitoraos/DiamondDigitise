// src/modules/payments/payments.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./payments.controller');

const router = Router();

// ── Public ───────────────────────────────────────────────────
// GET  /api/payments/poll/:paymentRef  — frontend polls this every 5s
router.get('/poll/:paymentRef', asyncHandler(controller.poll));

// ── Admin ────────────────────────────────────────────────────
// GET  /api/payments                   — list payments (owner/manager)
// GET  /api/payments/:id               — single payment detail
router.get('/',
  requireAuth,
  requireRole('owner', 'manager'),
  asyncHandler(controller.list)
);
router.get('/:id',
  requireAuth,
  asyncHandler(controller.getOne)
);

module.exports = router;
