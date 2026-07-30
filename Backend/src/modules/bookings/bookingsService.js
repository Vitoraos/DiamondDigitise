// src/modules/bookings/bookings.service.js
// ─────────────────────────────────────────────────────────────
// Booking lifecycle:
//   Guest submits checkout form
//   → createBooking() creates guest + booking + payment records,
//     marks the room 'reserved', and starts a payment-expiry timer
//   → returns payment_ref + account details for Monnify page
//   → payment service polls Monnify (or the reconciliation sweep /
//     expiry timer catches it) and calls confirmBooking()
//   → confirmBooking() moves room reserved → occupied, starts stay timers
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

    // Reserve the room so the room list stops advertising it as available
    // while payment is in flight. This is a display-consistency update only
    // — the actual double-booking guard is the unique constraint on the
    // bookings table that already rejected the insert above if the room
    // was taken. If this update loses a race (e.g. an admin flipped the
    // room to maintenance a moment ago), log it and continue — the
    // booking itself is already correctly created.
    const { error: roomReserveErr } = await supabaseAdmin
      .from('rooms')
      .update({ status: 'reserved' })
      .eq('id', roomId)
      .eq('status', 'available');

    if (roomReserveErr) {
      logger.warn('Could not mark room as reserved after booking creation', {
        bookingId: booking.id, roomId, error: roomReserveErr.message,
      });
    }

    // Auto-cancel this booking (and free the room) if payment never
    // completes. Without this, a guest who never pays holds the room
    // indefinitely — see startTimerWorker.js for the safeguard that
    // re-checks Monnify before actually cancelling.
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

    // Setting the status to confirmed. Dates will be finalized when verified/checked-in
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
      })
      .eq('id', bookingId);

    // Move the room reserved → occupied now that payment is in. Guarded
    // on 'reserved' so we notice — rather than silently overwrite — if
    // the room was put into maintenance while payment was pending. That's
    // a real physical conflict a human needs to resolve, not something
    // the system should paper over.
    const { data: roomUpdated, error: roomUpdateErr } = await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', booking.room_id)
      .eq('status', 'reserved')
      .select()
      .single();

    if (roomUpdateErr || !roomUpdated) {
      logger.warn('Room was not in reserved state when payment was confirmed — forcing to occupied. Check for a manual status change (e.g. maintenance) on this room.', {
        bookingId, roomId: booking.room_id,
      });
      await supabaseAdmin
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', booking.room_id);
    }

    logger.info('Booking confirmed', { bookingId });

    return { bookingId, bookingRef: booking.booking_ref };
  },

  /**
   * Fetch a booking by its human-readable ref.
   */
  async getBookingByRef(ref) {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, booking_ref, status, num_nights, total_amount, payment_ref,
        price_per_night, check_in_at, check_out_at, created_at,
        guests ( name, phone ),
        rooms ( room_number, floor ),
        categories ( name ),
        receipts ( receipt_number, pdf_url, issued_at ),
        payments ( status, amount_received )
      `)
      .or(`booking_ref.eq.${ref},payment_ref.eq.${ref},receipts.receipt_number.eq.${ref}`)
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
   */
  async verifyBooking(id, actor) {
    const booking = await this.getBookingById(id);

    if (booking.status !== 'confirmed') {
      throw new AppError('Booking is not in a verifiable state (must be confirmed)', 409, 'NOT_VERIFIED');
    }

    const now = new Date();

    // The user's checkout timer should start from when the payment is verified (checked-in)
    const checkOutAt = new Date(now);
    checkOutAt.setHours(checkOutAt.getHours() + booking.num_nights * 24);

    const { error: updateErr } = await supabaseAdmin
      .from('bookings')
      .update({
        status:       'checked_in',
        check_in_at:  now.toISOString(),
        check_out_at: checkOutAt.toISOString(),
        verified_at:  now.toISOString(),
        verified_by:  actor?.id || null,
      })
      .eq('id', id);

    if (updateErr) throw new AppError('Failed to verify booking', 500);

    // Make sure the room is occupied
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', booking.room_id);

    // Ensure we start the billing timer now that they are checked in
    await timersService.scheduleBookingTimers(id, checkOutAt.toISOString());

    if (actor?.id) {
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
    }

    logger.info('Booking verified & checked in', {
      bookingId:  id,
      actor:      actor?.fullName || 'system',
      verifiedAt: now.toISOString(),
    });

    return {
      valid:       true,
      bookingRef:  booking.booking_ref,
      guestName:   booking.guests.name,
      roomNumber:  booking.rooms.room_number,
      checkInAt:   now.toISOString(),
      checkOutAt:  checkOutAt.toISOString(),
      numNights:   booking.num_nights,
      totalAmount: booking.total_amount,
      verifiedAt:  now.toISOString(),
    };
  },

  async cancelBooking(id, actor) {
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, room_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !booking) throw new AppError('Booking not found', 404);

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .in('status', ['pending_payment', 'confirmed'])
      .select()
      .single();

    if (error || !data) throw new AppError('Cannot cancel this booking', 409);

    // Cancel all associated timers
    await timersService.cancelBookingTimers(id);
    await timersService.cancelPaymentExpiryTimer(id);

    // Always free the room if the booking is cancelled. A cancelled
    // booking could have been 'reserved' (payment never came in) or
    // 'occupied' (paid, then cancelled by staff) — cover both.
    await supabaseAdmin
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id)
      .in('status', ['reserved', 'occupied']);

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
