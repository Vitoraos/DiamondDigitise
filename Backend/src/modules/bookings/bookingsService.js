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
   */
  async createBooking({ roomId, guestName, guestPhone, guestEmail, numNights }) {
    if (!roomId || !guestName || !guestPhone || !numNights) {
      throw new AppError('roomId, guestName, guestPhone, numNights are required', 400);
    }

    const nights = parseInt(numNights, 10);
    if (isNaN(nights) || nights < 1 || nights > 30) {
      throw new AppError('numNights must be between 1 and 30', 400);
    }

    // Verify room availability
    const { data: room, error: roomErr } = await supabaseAdmin
      .from('rooms')
      .select('id, status, room_number, categories(id, price_per_night, name)')
      .eq('id', roomId)
      .single();

    if (roomErr || !room) throw new AppError('Room not found', 404);
    if (room.status !== 'available') {
      throw new AppError('Room is not available for booking', 409, 'ROOM_UNAVAILABLE');
    }

    const pricePerNight = parseFloat(room.categories.price_per_night);
    const totalAmount   = pricePerNight * nights;

    // Create or find guest by phone
    const { data: guest, error: guestErr } = await supabaseAdmin
      .from('guests')
      .upsert(
        { name: guestName, phone: guestPhone, email: guestEmail || null },
        { onConflict: 'phone', ignoreDuplicates: false }
      )
      .select('id')
      .single();

    if (guestErr) throw new AppError('Failed to save guest details', 500);

    const paymentRef = generatePaymentRef();
    const bookingRef = generateBookingRef();

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

    if (bookingErr) {
      if (bookingErr.code === '23505') {
        throw new AppError(
          'This room was just booked by another guest. Please select a different room.',
          409,
          'ROOM_DOUBLE_BOOKED'
        );
      }
      throw new AppError('Failed to create booking', 500);
    }

    const { error: payErr } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id:      booking.id,
        amount_expected: totalAmount,
        status:          'pending',
      });

    if (payErr) throw new AppError('Failed to initialise payment record', 500);

    // Initialise the payment expiry timer to auto-delete the booking and free up the room if unpaid
    await timersService.schedulePaymentExpiry(booking.id, paymentRef);

    logger.info('Booking created', {
      bookingId:  booking.id,
      bookingRef,
      paymentRef,
      roomId,
      nights,
      total: totalAmount,
    });

    return {
      bookingId:    booking.id,
      bookingRef,
      paymentRef,
      roomNumber:   room.room_number,
      categoryName: room.categories.name,
      numNights:    nights,
      pricePerNight,
      totalAmount,
      guestName,
    };
  },

  /**
   * Called by payment service after Monnify confirms payment.
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

    if (amountReceived < booking.total_amount) {
      throw new AppError('Insufficient payment', 402, 'INSUFFICIENT_PAYMENT');
    }

    const checkInAt  = new Date();
    const checkOutAt = new Date(checkInAt);
    checkOutAt.setHours(checkOutAt.getHours() + booking.num_nights * 24);

    await supabaseAdmin
      .from('bookings')
      .update({
        status:       'confirmed',
        check_in_at:  checkInAt.toISOString(),
        check_out_at: checkOutAt.toISOString(),
      })
      .eq('id', bookingId);

    await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', booking.room_id);

    // Clean up the expiry timer - they've paid successfully
    await timersService.cancelPaymentExpiryTimer(bookingId);

    logger.info('Booking confirmed', { bookingId, checkInAt, checkOutAt });

    return { bookingId, checkInAt, checkOutAt, bookingRef: booking.booking_ref };
  },

  /**
   * Fetch a booking by its human-readable ref.
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

    if (status) query = query.eq('status', status);
    if (roomId) query = query.eq('room_id', roomId);

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
   * Front-desk verifies the booking ref guest presents at reception.
   * Only allowed if status is 'confirmed' (prevents double verification).
   */
  async verifyBooking(id, actor) {
    const booking = await this.getBookingById(id);

    if (booking.status !== 'confirmed') {
      throw new AppError('Booking is not in a verifiable state', 409, 'NOT_VERIFIED');
    }

    const now = new Date().toISOString();

    const { error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        status:      'checked_in',
        verified_at: now,
        verified_by: actor.id,
      })
      .eq('id', id);

    if (updateErr) throw new AppError('Failed to verify booking', 500);

    await writeAuditLog({
      actorId:   actor.id,
      actorRole: actor.role,
      action:    'verify_booking',
      entity:    'bookings',
      entityId:  id,
      payload:   {
        bookingRef:     booking.booking_ref,
        previousStatus: booking.status,
      },
    });

    logger.info('Booking verified & checked in', {
      bookingId:  id,
      actor:      actor.fullName,
      verifiedAt: now,
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
      verifiedAt:  now,
    };
  },

  async cancelBooking(id, actor) {
    // We first get the room_id related to this booking to free the room up
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from('bookings')
      .select('id, room_id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !booking) throw new AppError('Booking not found', 404);

    // Cancel the booking (now explicitly supporting the failed incomplete_payment too)
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending_payment', 'incomplete_payment', 'confirmed'])
      .select()
      .single();

    if (error || !data) throw new AppError('Cannot cancel this booking in its current state', 409);

    // ✅ FIX: Assure the room goes back to available, allowing fresh bookings
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);

    // ✅ FIX: Kill any dangling timers on cancellation (stops false checkout triggers)
    await timersService.cancelBookingTimers(id);

    await writeAuditLog({
      actorId:   actor.id,
      actorRole: actor.role,
      action:    'cancel_booking',
      entity:    'bookings',
      entityId:  id,
    });

    return data;
  },

  /**
   * Front-desk checks out a guest.
   * Transitions booking to checked_out, room to cleaning, starts 80m cleaning timer.
   */
  async checkoutBooking(id, actor) {
    const booking = await this.getBookingById(id);

    if (booking.status !== 'checked_in') {
      throw new AppError('Booking is not in checked_in state', 409, 'NOT_CHECKED_IN');
    }

    const now    = new Date().toISOString();
    const roomId = booking.room_id;

    const { error: bookingErr } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'checked_out' })
      .eq('id', id);

    if (bookingErr) throw new AppError('Failed to update booking status', 500);

    const { error: roomErr } = await supabaseAdmin
      .from('rooms')
      .update({
        status:              'cleaning',
        cleaning_started_at: now,
      })
      .eq('id', roomId);

    if (roomErr) throw new AppError('Failed to update room status', 500);

    await timersService.scheduleCleaningTimer(roomId, id, new Date(now));

    await writeAuditLog({
      actorId:   actor.id,
      actorRole: actor.role,
      action:    'checkout_booking',
      entity:    'bookings',
      entityId:  id,
      payload:   {
        roomNumber: booking.rooms.room_number,
        bookingRef: booking.booking_ref,
      },
    });

    logger.info('Booking checked out & room cleaning started', {
      bookingId: id,
      roomId,
      actor:     actor.fullName,
    });

    return {
      success:           true,
      bookingId:         id,
      roomId,
      cleaningStartedAt: now,
      cleaningOverrunAt: new Date(
        new Date(now).getTime() + 80 * 60_000
      ).toISOString(),
    };
  },
};

module.exports = bookingsService;
