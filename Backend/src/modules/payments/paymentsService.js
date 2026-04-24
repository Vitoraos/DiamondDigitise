// src/modules/payments/payments.service.js
// ─────────────────────────────────────────────────────────────
// Payment flow:
//   1. Frontend polls GET /api/payments/poll/:paymentRef every 5s
//   2. pollPaymentStatus() calls Monnify API to check if money arrived
//   3. If paid in full → confirmBooking(), create receipt, start timers
//   4. If paid short   → flag incomplete, trigger refund (amount - ₦50)
//   5. If pending      → return { status: 'pending' } → frontend keeps polling
// ─────────────────────────────────────────────────────────────
'use strict';

const axios = require('axios');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const logger = require('../../lib/logger');
const bookingsService = require('../bookings/bookings.service');
const receiptsService = require('../receipts/receipts.service');
const timersService = require('../timers/timers.service');
const notificationService = require('../notifications/notifications.service');

// ── Monnify auth token cache ──────────────────────────────────
let monnifyToken = null;
let monnifyTokenExpiry = 0;

async function getMonnifyToken() {
  if (monnifyToken && Date.now() < monnifyTokenExpiry) return monnifyToken;

  const credentials = Buffer.from(
    `${config.monnify.apiKey}:${config.monnify.secretKey}`
  ).toString('base64');

  const { data } = await axios.post(
    `${config.monnify.baseUrl}/api/v1/auth/login`,
    {},
    { headers: { Authorization: `Basic ${credentials}` } }
  );

  monnifyToken       = data.responseBody.accessToken;
  monnifyTokenExpiry = Date.now() + (data.responseBody.expiresIn * 1000) - 30_000;

  return monnifyToken;
}

async function monnifyGet(path) {
  const token = await getMonnifyToken();
  const { data } = await axios.get(`${config.monnify.baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.responseBody;
}

async function monnifyPost(path, body) {
  const token = await getMonnifyToken();
  const { data } = await axios.post(`${config.monnify.baseUrl}${path}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.responseBody;
}

const paymentsService = {

  /**
   * Called by frontend every 5 seconds.
   * Checks Monnify for a transaction matching this payment_ref.
   * Returns the current state so the frontend can react.
   */
  async pollPaymentStatus(paymentRef) {
    // ── Look up our booking by payment_ref ───────────────────
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, payment_ref, payments(id, status, amount_received)')
      .eq('payment_ref', paymentRef)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);

    const payment = booking.payments?.[0];

    // ── Already resolved states — return immediately ─────────
    if (booking.status === 'confirmed') {
      return { status: 'confirmed', bookingId: booking.id };
    }
    if (booking.status === 'incomplete_payment') {
      return { status: 'incomplete_payment', bookingId: booking.id };
    }
    if (booking.status === 'cancelled') {
      return { status: 'cancelled' };
    }

    // ── Query Monnify for transactions matching our ref ──────
    let monnifyTx = null;
    try {
      // Monnify: search transactions by payment reference
      const encoded = encodeURIComponent(paymentRef);
      monnifyTx = await monnifyGet(
        `/api/v2/transactions/search?paymentReference=${encoded}&contractCode=${config.monnify.contractCode}`
      );
    } catch (err) {
      // Monnify API unavailable — return pending, don't crash
      logger.warn('Monnify API unavailable during poll', { error: err.message });
      return { status: 'pending' };
    }

    // If no transaction yet — still waiting
    if (!monnifyTx || !monnifyTx.content || monnifyTx.content.length === 0) {
      return { status: 'pending' };
    }

    const tx = monnifyTx.content[0];
    const amountReceived = parseFloat(tx.amountPaid || 0);
    const monnifyRef     = tx.transactionReference;

    // ── Not yet paid ─────────────────────────────────────────
    if (tx.paymentStatus !== 'PAID') {
      return { status: 'pending' };
    }

    // ── GUARDRAIL: shortfall check ───────────────────────────
    if (amountReceived < booking.total_amount) {
      await this._handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx);
      return { status: 'incomplete_payment', bookingId: booking.id };
    }

    // ── Full payment received — confirm booking ───────────────
    await this._handleFullPayment(booking, payment, amountReceived, monnifyRef);
    return { status: 'confirmed', bookingId: booking.id };
  },

  /**
   * Full payment path:
   * - Update payment record
   * - Confirm booking (sets room to in_use, sets stay window)
   * - Generate receipt
   * - Schedule timers
   */
  async _handleFullPayment(booking, payment, amountReceived, monnifyRef) {
    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status:          'confirmed',
        amount_received: amountReceived,
        monnify_ref:     monnifyRef,
        confirmed_at:    new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Confirm booking + set room in_use + get stay window
    const { checkInAt, checkOutAt, bookingRef } = await bookingsService.confirmBooking(
      booking.id,
      amountReceived,
      monnifyRef
    );

    // Generate receipt
    await receiptsService.generateReceipt(booking.id);

    // Schedule timers
    await timersService.scheduleBookingTimers(booking.id, checkOutAt);

    logger.info('Payment confirmed and booking activated', {
      bookingId: booking.id,
      amountReceived,
    });
  },

  /**
   * Incomplete payment path:
   * - Flag booking as incomplete_payment
   * - Update payment record with shortfall
   * - Trigger Monnify refund (amount - ₦50 fee)
   * - Notify guest via response (frontend shows the message)
   */
  async _handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx) {
    const shortfall    = booking.total_amount - amountReceived;
    const refundFeeNaira = config.monnify.refundFeeKobo / 100;
    const refundAmount = Math.max(0, amountReceived - refundFeeNaira);

    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status:          'partial_refunded',
        amount_received: amountReceived,
        monnify_ref:     monnifyRef,
        shortfall,
        refund_amount:   refundAmount,
        monnify_response: tx,
      })
      .eq('id', payment.id);

    // Flag booking
    await supabaseAdmin
      .from('bookings')
      .update({ status: 'incomplete_payment' })
      .eq('id', booking.id);

    // Trigger Monnify refund
    try {
      await monnifyPost('/api/v1/refunds/initiate-refund', {
        transactionReference: monnifyRef,
        refundReason:         'Incomplete payment — amount paid is less than booking total',
        refundAmount:         refundAmount,
        contractCode:         config.monnify.contractCode,
        customerNote:         `Your payment of ₦${amountReceived} was less than the required ₦${booking.total_amount}. A refund of ₦${refundAmount} (after ₦${refundFeeNaira} processing fee) has been initiated.`,
      });

      await supabaseAdmin
        .from('payments')
        .update({ refunded_at: new Date().toISOString() })
        .eq('id', payment.id);

    } catch (err) {
      // Refund API failure — log for manual processing, don't crash
      logger.error('Monnify refund failed — manual action required', {
        bookingId:   booking.id,
        monnifyRef,
        amountReceived,
        refundAmount,
        error:       err.message,
      });
    }

    // Notify owner of the incomplete payment
    await notificationService.notifyIncompletePayment({
      bookingRef:    booking.payment_ref,
      amountExpected: booking.total_amount,
      amountReceived,
      shortfall,
      refundAmount,
    });

    logger.info('Incomplete payment handled', {
      bookingId: booking.id,
      amountReceived,
      shortfall,
      refundAmount,
    });
  },

  async listPayments(query = {}) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        id, status, amount_expected, amount_received,
        shortfall, refund_amount, confirmed_at, created_at,
        bookings ( booking_ref, guests(name, phone) )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async getPaymentById(id) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, bookings(*, guests(*), rooms(*))')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError('Payment not found', 404);
    return data;
  },
};

module.exports = paymentsService;
