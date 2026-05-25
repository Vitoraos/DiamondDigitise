'use strict';
const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./controller');

const router = Router();

// ✅ NEW: List all receipts (Admin, Manager, Front Desk)
router.get('/', 
  requireAuth, 
  requireRole('owner', 'manager', 'front_desk'), 
  asyncHandler(controller.list)
);

// GET /api/receipts/:bookingId   — fetch receipt (public, guest has bookingId)
router.get('/:bookingId', asyncHandler(controller.getByBooking));

module.exports = router;
