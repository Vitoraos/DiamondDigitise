// src/modules/receipts/receipts.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const controller = require('./receipts.controller');

const router = Router();

// GET /api/receipts/:bookingId   — fetch receipt (public, guest has bookingId)
router.get('/:bookingId', asyncHandler(controller.getByBooking));

module.exports = router;
