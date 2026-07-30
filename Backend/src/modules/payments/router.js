// src/modules/payments/payments.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./controller');

const router = Router();

// ── Public ───────────────────────────────────────────────────
// GET  /api/payments/poll/:paymentRef  — manual fallback check
router.get('/poll/:paymentRef', asyncHandler(controller.poll));

// GET  /api/payments/stream/:paymentRef — SSE, primary confirmation push
router.get('/stream/:paymentRef', asyncHandler(controller.stream));

// POST /api/payments/webhook — Monnify server-to-server notification
router.post('/webhook', asyncHandler(controller.webhook));

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
