// src/lib/refGenerator.js
// ─────────────────────────────────────────────────────────────
// Generates human-readable, unique references.
//
//   Booking ref:  HTL-20240421-A3F9
//   Receipt ref:  RCP-20240421-001-X7K2
//
// The random suffix makes collisions astronomically unlikely
// even at high concurrency. The DB unique constraint is the
// final safety net.
// ─────────────────────────────────────────────────────────────
'use strict';

const { randomBytes } = require('crypto');
const config = require('../config');

function datePart() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
}

function randomSuffix(bytes = 3) {
  return randomBytes(bytes).toString('hex').toUpperCase().slice(0, 4);
}

/**
 * Generate a booking payment reference.
 * Example: HTL-20240421-A3F9
 */
function generatePaymentRef() {
  return `${config.booking.refPrefix}-${datePart()}-${randomSuffix()}`;
}

/**
 * Generate a receipt number.
 * Example: RCP-20240421-A3F9
 */
function generateReceiptNumber() {
  return `${config.booking.receiptPrefix}-${datePart()}-${randomSuffix()}`;
}

/**
 * Generate a guest-facing booking ID (same as booking UUID but
 * the ref is what gets shown on receipt + used for key handover).
 */
function generateBookingRef() {
  return `${config.booking.refPrefix}-${datePart()}-${randomSuffix(4)}`;
}

module.exports = { generatePaymentRef, generateReceiptNumber, generateBookingRef };
