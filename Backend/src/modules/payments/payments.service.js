// src/modules/payments/payments.service.js
'use strict';
const axios = require('axios');
const crypto = require('crypto');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const logger = require('../../lib/logger');
const bookingsService     = require('../bookings/bookingsService');
const receiptsService     = require('../receipts/receipts.service');
const timersService       = require('../timers/timersService');
const notificationService = require('../notifications/notificationService');
const paymentStream        = require('./paymentStream');

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

const BOOKING_SELECT = 'id, status, total_amount, payment_ref, booking_ref, num_nights, rooms(room_number), guests(name), payments(id, status, amount_received)';

const paymentsService = {

  /**
   * Verifies the `monnify-signature` header: HMAC-SHA512 of the raw
   * request body, keyed with the Monnify secret key. req.rawBody is
   * captured in app.js's express.json verify hook.
   */
  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!rawBody || !signatureHeader) return false;
    const expected = crypto
      .createHmac('sha512', config.monnify.secretKey)
      .update(rawBody)
      .digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
    } catch {
      return false; // length mismatch etc. — treat as invalid, not a crash
    }
  },

  /**
   * Monnify server-to-server notification. This is now the primary
   * confirmation path (the reconciliation sweep and payment_expiry
   * re-check remain as fallbacks in case a webhook delivery is lost).
   */
  async handleWebhook(eventPayload) {
    const { eventType, eventData } = eventPayload || {};

    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
      logger.info('Ignoring non-success Monnify webhook event', { eventType });
      return { ignored: true };
    }

    const paymentRef = eventData?.paymentReference;
    if (!paymentRef) {
      logger.warn('Monnify webhook missing paymentReference', { eventData });
      return { ignored: true };
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('payment_ref', paymentRef)
      .single();

    if (error || !booking) {
      logger.warn('Monnify webhook for unknown paymentReference', { paymentRef });
      return { ignored: true };
    }

    // Idempotency: webhooks can be retried by Monnify, or arrive after the
    // sweep/expiry-recheck already resolved this booking. Don't re-process.
    if (booking.status !== 'pending_payment') {
      return { alreadyProcessed: true, status: booking.status };
    }

    const payment = booking.payments?.[0];
    const amountReceived = parseFloat(eventData.amountPaid || 0);
    const monnifyRef = eventData.transactionReference;

    if (eventData.paymentStatus !== 'PAID') {
      return { ignored: true };
    }

    if (amountReceived < booking.total_amount) {
      await this._handleIncompletePayment(booking, payment, amountReceived, monnifyRef, eventData);
      return { status: 'incomplete_payment', bookingId: booking.id };
    }

    await this._handleFullPayment(booking, payment, amountReceived, monnifyRef);
    return { status: 'confirmed', bookingId: booking.id };
  },

  /**
   * Kept as a manual "check now" fallback (e.g. if a browser/network
   * blocks the SSE connection) and as the initial status check when a
   * stream connection first opens.
   */
  async pollPaymentStatus(paymentRef) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('payment_ref', paymentRef)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);
    return this._checkMonnifyAndReconcile(booking);
  },

  /**
   * Re-verify a specific booking against Monnify by id. Used by:
   *  - the payment_expiry timer, to confirm a booking really wasn't paid
   *    before auto-cancelling it
   *  - the periodic reconciliation sweep, which catches bookings whose
   *    webhook delivery was lost
   */
  async reconcileBookingById(bookingId) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('id', bookingId)
      .single();

    if (error || !booking) return { status: 'not_found' };
    return this._checkMonnifyAndReconcile(booking);
  },

  async reconcilePendingPayments() {
    const cutoff = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // just past the 12-min expiry window
    const { data: pending, error } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('status', 'pending_payment')
      .gte('created_at', cutoff);

    if (error) {
      logger.error('Reconciliation sweep failed to list pending bookings', { error: error.message });
      return;
    }

    for (const b of pending || []) {
      try {
        await this.reconcileBookingById(b.id);
      } catch (err) {
        logger.error('Reconciliation sweep failed for booking', { bookingId: b.id, error: err.message });
      }
    }

    logger.info('Payment reconciliation sweep complete', { checked: pending?.length || 0 });
  },

  async _checkMonnifyAndReconcile(booking) {
    const payment = booking.payments?.[0];

    const paymentDetails = {
      accountNumber: config.monnify.accountNumber,
      bankName:      config.monnify.bankName,
      accountName:   config.monnify.accountName,
      amount:        booking.total_amount,
      paymentRef:    booking.payment_ref,
    };

    if (booking.status === 'confirmed') return { status: 'confirmed', bookingId: booking.id };
    if (booking.status === 'incomplete_payment') return { status: 'incomplete_payment', bookingId: booking.id };
    if (booking.status === 'cancelled') return { status: 'cancelled' };

    let monnifyTx = null;
    try {
      const encoded = encodeURIComponent(booking.payment_ref);
      monnifyTx = await monnifyGet(
        `/api/v2/transactions/search?paymentReference=${encoded}&contractCode=${config.monnify.contractCode}`
      );
    } catch (err) {
      logger.warn('Monnify API unavailable during payment check', { error: err.message, bookingId: booking.id });
      return { status: 'pending', paymentDetails };
    }

    if (!monnifyTx || !monnifyTx.content || monnifyTx.content.length === 0) {
      return { status: 'pending', paymentDetails };
    }

    const tx = monnifyTx.content[0];
    const amountReceived = parseFloat(tx.amountPaid || 0);
    const monnifyRef     = tx.transactionReference;

    if (tx.paymentStatus !== 'PAID') {
      return { status: 'pending', paymentDetails };
    }

    if (amountReceived < booking.total_amount) {
      await this._handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx);
      return { status: 'incomplete_payment', bookingId: booking.id };
    }

    await this._handleFullPayment(booking, payment, amountReceived, monnifyRef);
    return { status: 'confirmed', bookingId: booking.id };
  },

  async _handleFullPayment(booking, payment, amountReceived, monnifyRef) {
    await bookingsService.confirmBooking(booking.id, amountReceived, monnifyRef);

    await timersService.cancelPaymentExpiryTimer(booking.id);

    await supabaseAdmin.from('payments').update({
      status: 'confirmed', amount_received: amountReceived,
      monnify_ref: monnifyRef, confirmed_at: new Date().toISOString(),
    }).eq('id', payment.id);

    await receiptsService.generateReceipt(booking.id);

    await notificationService.notifyNewBooking({
      bookingRef: booking.booking_ref, guestName: booking.guests?.name,
      roomNumber: booking.rooms?.room_number,
      totalAmount: booking.total_amount, numNights: booking.num_nights,
    });

    paymentStream.publish(booking.payment_ref, { status: 'confirmed', bookingId: booking.id });

    logger.info('Payment confirmed via monnify', { bookingId: booking.id, amountReceived });
  },

  async _handleIncompletePayment(booking, payment, amountReceived, monnifyRef, tx) {
    const shortfall      = booking.total_amount - amountReceived;
    const refundFeeNaira = config.monnify.refundFeeKobo / 100;
    const refundAmount   = Math.max(0, amountReceived - refundFeeNaira);

    await supabaseAdmin.from('payments').update({
      amount_received: amountReceived, shortfall, monnify_ref: monnifyRef,
      monnify_response: tx, status: 'incomplete',
    }).eq('id', payment.id);

    await supabaseAdmin.from('bookings').update({ status: 'incomplete_payment' }).eq('id', booking.id);

    let refundedAt = null;
    try {
      await monnifyPost('/api/v1/refunds/initiate-refund', {
        transactionReference: monnifyRef,
        refundReason: 'Incomplete payment',
        refundAmount, contractCode: config.monnify.contractCode,
        customerNote: `Refund of ₦${refundAmount} initiated.`,
      });
      refundedAt = new Date().toISOString();
    } catch (err) {
      logger.error('Monnify refund failed', { error: err.message });
    }

    if (refundedAt) {
      await supabaseAdmin.from('payments').update({
        status: 'partial_refunded', refund_amount: refundAmount, refunded_at: refundedAt,
      }).eq('id', payment.id);
    }

    await notificationService.notifyIncompletePayment({
      bookingRef: booking.booking_ref,
      amountExpected: booking.total_amount,
      amountReceived, shortfall, refundAmount,
    });

    paymentStream.publish(booking.payment_ref, { status: 'incomplete_payment', bookingId: booking.id });
  },

  async listPayments(query = {}) {
    const { data, error } = await supabaseAdmin.from('payments')
      .select(`id, status, amount_expected, amount_received, shortfall, refund_amount, confirmed_at, created_at, bookings ( booking_ref, guests(name, phone) )`)
      .order('created_at', { ascending: false }).limit(200);
    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async getPaymentById(id) {
    const { data, error } = await supabaseAdmin.from('payments')
      .select('*, bookings(*, guests(*), rooms(*))').eq('id', id).single();
    if (error || !data) throw new AppError('Payment not found', 404);
    return data;
  },
};

module.exports = paymentsService;
