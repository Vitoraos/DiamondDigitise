// src/modules/bookings/bookings.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./bookings.controller');

const router = Router();

// ── Public ───────────────────────────────────────────────────
// POST /api/bookings                — create booking (guest checkout)
// GET  /api/bookings/ref/:ref       — fetch booking by ref (receipt page)
router.post('/',          asyncHandler(controller.create));
router.get('/ref/:ref',   asyncHandler(controller.getByRef));

// ── Admin ────────────────────────────────────────────────────
// GET  /api/bookings                — list all bookings (admin)
// GET  /api/bookings/:id            — single booking detail
// POST /api/bookings/:id/verify     — front-desk verifies booking ID
router.get('/',
  requireAuth,
  asyncHandler(controller.list)
);
router.get('/:id',
  requireAuth,
  asyncHandler(controller.getOne)
);
router.post('/:id/verify',
  requireAuth,
  asyncHandler(controller.verify)
);

// ── Owner / Manager ──────────────────────────────────────────
// PATCH /api/bookings/:id/cancel    — cancel a booking
router.patch('/:id/cancel',
  requireAuth,
  requireRole('owner', 'manager'),
  asyncHandler(controller.cancel)
);

module.exports = router;
