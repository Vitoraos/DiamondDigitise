// src/modules/receipts/receipts.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
// ✅ FIX: was require('./receipts.controller') — file is actually controller.js
const controller = require('./controller');

const router = Router();

// GET /api/receipts/:bookingId   — fetch receipt (public, guest has bookingId)
router.get('/:bookingId', asyncHandler(controller.getByBooking));

module.exports = router;
