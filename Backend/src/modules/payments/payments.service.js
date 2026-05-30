// src/modules/payments/payments.service.js
'use strict';
const axios = require('axios');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const logger = require('../../lib/logger');
const bookingsService    = require('../bookings/bookingsService');
const receiptsService    = require('../receipts/receipts.service');
const timersService      = require('../timers/timersService');
const notificationService = require('../notifications/notificationService');

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
  async pollPaymentStatus(paymentRef) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, payment_ref, booking_ref, num_nights, rooms(room_number), guests(name), payments(id, status, amount_received)')
      .eq('payment_ref', paymentRef)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);

    const payment = booking.payments?.[0];

    // Bundle Monnify account details to send to the frontend
    const paymentDetails = {
      accountNumber: config.monnify.accountNumber,
      bankName:      config.monnify.bankName,
      accountName:   config.monnify.accountName,
      amount:        booking.total_amount,
      paymentRef:    paymentRef,
    };

    if (booking.status === 'confirmed') return { status: 'confirmed', bookingId: booking.id };
    if (booking.status === 'incomplete_payment') return { status: 'incomplete_payment', bookingId: booking.id };
    if (booking.status === 'cancelled') return { status: 'cancelled' };

    let monnifyTx = null;
    try {
      const encoded = encodeURIComponent(paymentRef);
      monnifyTx = await monnifyGet(
        `/api/v2/transactions/search?paymentReference=${encoded}&contractCode=${config.monnify.contractCode}`
      );
    } catch (err) {
      logger.warn('Monnify API unavailable during poll', { error: err.message });
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
    const { bookingRef } = await bookingsService.confirmBooking(
      booking.id, amountReceived, monnifyRef
    );

    // Cancel expiry timer if they paid fully
    await timersService.cancelPaymentExpiryTimer(booking.id);

    await supabaseAdmin.from('payments').update({
      status: 'confirmed', amount_received: amountReceived,
      monnify_ref: monnifyRef, confirmed_at: new Date().toISOString(),
    }).eq('id', payment.id);

    await receiptsService.generateReceipt(booking.id);
    
    // NOTE: Timers no longer started here. They will start when verifyBooking (check in) is called at the desk.
    
    await notificationService.notifyNewBooking({
      bookingRef: booking.booking_ref, guestName: booking.guests?.name,
      roomNumber: booking.rooms?.room_number,
      totalAmount: booking.total_amount, numNights: booking.num_nights,
    });
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
