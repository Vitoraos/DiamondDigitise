// src/modules/bookings/bookings.service.js
// ─────────────────────────────────────────────────────────────
// Booking lifecycle:
//   Guest submits checkout form
//   → createBooking() creates guest + booking + payment records
//   → returns payment_ref + account details for Monnify page
//   → payment service polls Monnify and calls confirmBooking()
//   → confirmBooking() sets room to in_use, starts timers
// ─────────────────────────────────────────────────────────────
'use strict';
const timersService = require('../timers/timersService');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const { generatePaymentRef, generateBookingRef } = require('../../lib/refGenerator');
const { writeAuditLog } = require('../../lib/auditLog');
const logger = require('../../lib/logger');

const bookingsService = {

  /**
   * Create a booking from the guest checkout form.
   * Does NOT confirm the room — that happens after payment.
   *
   * @param {{ roomId, guestName, guestPhone, guestEmail, numNights }} body
   */
  async createBooking({ roomId, guestName, guestPhone, guestEmail, numNights }) {
    // ── Validate inputs ──────────────────────────────────────
    if (!roomId || !guestName || !guestPhone || !numNights) {
      throw new AppError('roomId, guestName, guestPhone, numNights are required', 400);
    }

    const nights = parseInt(numNights, 10);
    if (isNaN(nights) || nights < 1 || nights > 30) {
      throw new AppError('numNights must be between 1 and 30', 400);
    }

    // ── Verify room is available ─────────────────────────────
    const { data: room, error: roomErr } = await supabaseAdmin
      .from('rooms')
      .select('id, status, categories(id, price_per_night, name)')
      .eq('id', roomId)
      .single();

    if (roomErr || !room) throw new AppError('Room not found', 404);
    if (room.status !== 'available') {
      throw new AppError('Room is not available for booking', 409, 'ROOM_UNAVAILABLE');
    }

    // ── Snapshot price at booking time ───────────────────────
    const pricePerNight = parseFloat(room.categories.price_per_night);
    const totalAmount   = pricePerNight * nights;

    // ── Create or find guest ─────────────────────────────────
    // Upsert by phone so repeat guests aren't duplicated
    const { data: guest, error: guestErr } = await supabaseAdmin
      .from('guests')
      .upsert(
        { name: guestName, phone: guestPhone, email: guestEmail || null },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (guestErr) throw new AppError('Failed to save guest details', 500);

    // ── Generate unique refs ─────────────────────────────────
    const paymentRef = generatePaymentRef();
    const bookingRef = generateBookingRef();

    // ── Insert booking ───────────────────────────────────────
    const { data: booking, error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .insert({
        booking_ref:     bookingRef,
        room_id:         roomId,
        guest_id:        guest.id,
        category_id:     room.categories.id,
        price_per_night: pricePerNight,
        num_nights:      nights,
        total_amount:    totalAmount,
        payment_ref:     paymentRef,
        status:          'pending_payment',
      })
      .select()
      .single();

    if (bookingErr) throw new AppError('Failed to create booking', 500);

    // ── Insert payment record ────────────────────────────────
    const { error: payErr } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id:       booking.id,
        amount_expected:  totalAmount,
        status:           'pending',
      });

    if (payErr) throw new AppError('Failed to initialise payment record', 500);

    logger.info('Booking created', {
      bookingId:  booking.id,
      bookingRef,
      paymentRef,
      roomId,
      nights,
      total: totalAmount,
    });

    // ── Return everything the payment page needs ─────────────
    return {
      bookingId:      booking.id,
      bookingRef,
      paymentRef,
      roomNumber:     room.room_number,
      categoryName:   room.categories.name,
      numNights:      nights,
      pricePerNight,
      totalAmount,
      guestName,
    };
  },

  /**
   * Called by payment service after Monnify confirms payment.
   * Locks the room, sets stay window, schedules timers.
   *
   * @param {string} bookingId
   * @param {number} amountReceived
   * @param {string} monnifyRef
   */
  async confirmBooking(bookingId, amountReceived, monnifyRef) {
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, rooms(id, status)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) throw new AppError('Booking not found', 404);
    if (booking.status !== 'pending_payment') {
      throw new AppError('Booking is not awaiting payment', 409);
    }

    // ── Guardrail: check amount ──────────────────────────────
    if (amountReceived < booking.total_amount) {
      // Handled by payment service — it triggers the refund.
      throw new AppError('Insufficient payment', 402, 'INSUFFICIENT_PAYMENT');
    }

    // ── Set stay window ──────────────────────────────────────
    const checkInAt  = new Date();
    const checkOutAt = new Date(checkInAt);
    checkOutAt.setHours(checkOutAt.getHours() + booking.num_nights * 24);

    // ── Update booking ───────────────────────────────────────
    await supabaseAdmin
      .from('bookings')
      .update({
        status:       'confirmed',
        check_in_at:  checkInAt.toISOString(),
        check_out_at: checkOutAt.toISOString(),
      })
      .eq('id', bookingId);

    // ── Mark room as in_use ──────────────────────────────────
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'in_use' })
      .eq('id', booking.room_id);

    logger.info('Booking confirmed', { bookingId, checkInAt, checkOutAt });

    return { bookingId, checkInAt, checkOutAt, bookingRef: booking.booking_ref };
  },

  /**
   * Fetch a booking by its human-readable ref.
   * Used by the receipt page (public — no auth needed).
   */
  async getBookingByRef(ref) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_ref, status, num_nights, total_amount,
        price_per_night, check_in_at, check_out_at, created_at,
        guests ( name, phone ),
        rooms ( room_number, floor ),
        categories ( name ),
        receipts ( receipt_number, pdf_url, issued_at )
      `)
      .eq('booking_ref', ref)
      .single();

    if (error || !data) throw new AppError('Booking not found', 404);
    return data;
  },

  /**
   * Admin: list all bookings with optional filters.
   */
  async listBookings({ status, date, roomId } = {}) {
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_ref, status, total_amount, num_nights,
        check_in_at, check_out_at, created_at,
        guests ( name, phone ),
        rooms ( room_number ),
        categories ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (status)  query = query.eq('status', status);
    if (roomId)  query = query.eq('room_id', roomId);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return data;
  },

  async getBookingById(id) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *, guests(*), rooms(*), categories(*),
        payments(*), receipts(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError('Booking not found', 404);
    return data;
  },

  /**
* Front-desk verifies the booking ID guest presents at reception.
* Transitions status to checked_in, stamps verified_at/verified_by, logs audit.
*/
async verifyBooking(id, actor) {
  const booking = await this.getBookingById(id);
  
  // Allow re-verification if already checked_in, but block invalid states
  if (!['confirmed', 'checked_in'].includes(booking.status)) {
    throw new AppError('Booking is not in a verifiable state', 409, 'NOT_VERIFIED');
  }

  const now = new Date().toISOString();

  // ── 1. Update booking record with verification metadata ────
  const { error: updateErr } = await supabaseAdmin
    .from('bookings')
    .update({
      status:      'checked_in',
      verified_at: now,
      verified_by: actor.id
    })
    .eq('id', id);
  if (updateErr) throw new AppError('Failed to verify booking', 500);

  // ── 2. Write audit log ────────────────────────────────────
  await writeAuditLog({
    actorId:   actor.id,
    actorRole: actor.role,
    action:    'verify_booking',
    entity:    'bookings',
    entityId:  id,
    payload:   { 
      bookingRef: booking.booking_ref,
      previousStatus: booking.status 
    },
  });

  logger.info('Booking verified & checked in', { 
    bookingId: id, 
    actor: actor.fullName,
    verifiedAt: now 
  });

  return {
    valid:       true,
    bookingRef:  booking.booking_ref,
    guestName:   booking.guests.name,
    roomNumber:  booking.rooms.room_number,
    checkInAt:   booking.check_in_at,
    checkOutAt:  booking.check_out_at,
    numNights:   booking.num_nights,
    totalAmount: booking.total_amount,
    verifiedAt: now
  };
},


  async cancelBooking(id, actor) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending_payment', 'confirmed'])
      .select()
      .single();

    if (error || !data) throw new AppError('Cannot cancel this booking', 409);

    await writeAuditLog({
      actorId:   actor.id,
      actorRole: actor.role,
      action:    'cancel_booking',
      entity:    'bookings',
      entityId:  id,
    });

    return data;
  },
};

// ── ADD THIS METHOD TO bookingsService ──
/**
 * Front-desk checks out a guest.
 * Transitions booking to checked_out, room to cleaning, and starts 80m cleaning timer.
 * @param {string} id - booking UUID
 * @param {{ id, role, fullName }} actor - admin performing checkout
 */
async checkoutBooking(id, actor) {
  const booking = await this.getBookingById(id);
  
  // Guard: Only checked_in bookings can be processed for checkout
  if (booking.status !== 'checked_in') {
    throw new AppError('Booking is not in checked_in state', 409, 'NOT_CHECKED_IN');
  }

  const now = new Date().toISOString();
  const roomId = booking.room_id;

  // ── 1. Update booking status ──────────────────────────────
  const { error: bookingErr } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'checked_out' })
    .eq('id', id);
  if (bookingErr) throw new AppError('Failed to update booking status', 500);

  // ── 2. Transition room to cleaning ────────────────────────
  // Sets status='cleaning' and records cleaning_started_at
  const { error: roomErr } = await supabaseAdmin
    .from('rooms')
    .update({ 
      status: 'cleaning', 
      cleaning_started_at: now 
    })
    .eq('id', roomId);
  if (roomErr) throw new AppError('Failed to update room status', 500);

  // ── 3. Schedule 80-minute cleaning overrun timer ─────────
  // Uses the exact bookingId for audit context
  await timersService.scheduleCleaningTimer(roomId, id, new Date(now));

  // ── 4. Audit log ─────────────────────────────────────────
  await writeAuditLog({
    actorId:   actor.id,
    actorRole: actor.role,
    action:    'checkout_booking',
    entity:    'bookings',
    entityId:  id,
    payload:   { 
      roomNumber: booking.rooms.room_number,
      bookingRef: booking.booking_ref 
    },
  });

  logger.info('Booking checked out & room cleaning started', {
    bookingId: id,
    roomId,
    actor: actor.fullName,
  });

  return {
    success: true,
    bookingId: id,
    roomId,
    cleaningStartedAt: now,
    cleaningOverrunAt: new Date(
      new Date(now).getTime() + 80 * 60_000
    ).toISOString(),
  };
}


module.exports = bookingsService;
