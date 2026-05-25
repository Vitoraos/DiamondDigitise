'use strict';
const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const notificationService = require('./notificationService'); // ✅ FIX: Moved to top

const router = Router();

router.post('/test', requireAuth, requireRole('owner'), asyncHandler(async (req, res) => {
  await notificationService.notifyNewBooking({ bookingRef: 'TEST', guestName: 'Test', roomNumber: '000', totalAmount: 0, numNights: 0 });
  res.json({ message: 'Test notification sent' });
}));

module.exports = router;
