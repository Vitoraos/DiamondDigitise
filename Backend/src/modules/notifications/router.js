// src/modules/notifications/notifications.routes.js
// Internal use only — no public endpoints currently.
// Future: owner could trigger a manual test notification.
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = Router();

router.post('/test',
  requireAuth,
  requireRole('owner'),
  asyncHandler(async (req, res) => {
const notificationService = require('./notificationService');
await notificationService.notifyNewBooking({ bookingRef: 'TEST', guestName: 'Test', roomNumber: '000', totalAmount: 0, numNights: 0 });
    res.json({ message: 'Test notification sent' });
  })
);

module.exports = router;
