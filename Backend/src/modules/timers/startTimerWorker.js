// src/modules/timers/timers.worker.js
'use strict';

const { getQueue } = require('../../lib/queue');
const { supabaseAdmin } = require('../../lib/supabase');
const config = require('../../config');
const logger = require('../../lib/logger');
const notificationService = require('../notifications/notificationService');
const timersService = require('./timersService');
const paymentsService = require('../payments/payments.service');

function startTimerWorker() {
  const queue = getQueue('timers');

  queue.process(async (job) => {
    const { bookingId, type, roomId } = job.data;
    logger.info('Timer fired', { bookingId, type });

    // Only per-booking/room timers have a row in the `timers` table.
    // The reconciliation sweep is a bare repeatable job with no bookingId.
    if (bookingId) {
      await supabaseAdmin
        .from('timers')
        .update({ fired: true, fired_at: new Date().toISOString() })
        .eq('bull_job_id', String(job.id));
    }

    switch (type) {

      case 'stay_end': {
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'checked_out' })
          .eq('id', bookingId)
          .eq('status', 'checked_in'); // guard: only update if still checked in
        logger.info('Stay ended — booking marked checked_out', { bookingId });
        break;
      }

      case 'payment_expiry': {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('status, room_id, payment_ref')
          .eq('id', bookingId)
          .single();

        if (booking?.status === 'pending_payment') {
          const result = await paymentsService.reconcileBookingById(bookingId);

          if (result.status === 'confirmed' || result.status === 'incomplete_payment') {
            logger.info('Payment expiry timer fired but booking was actually paid — reconciled instead of cancelling', {
              bookingId, result: result.status,
            });
            break;
          }

          await supabaseAdmin.from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

          await supabaseAdmin.from('rooms')
            .update({ status: 'available' })
            .eq('id', booking.room_id)
            .in('status', ['reserved', 'occupied']);

          paymentStream.publish(booking.payment_ref, { status: 'cancelled', bookingId });

          logger.info('Booking auto-cancelled: payment timeout', { bookingId });
        }
        break;
      }
          await supabaseAdmin.from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

          // Free up the room since payment expired. Guard against
          // clobbering a room an admin has since put into maintenance.
          await supabaseAdmin.from('rooms')
            .update({ status: 'available' })
            .eq('id', booking.room_id)
            .in('status', ['reserved', 'occupied']);

          logger.info('Booking auto-cancelled: payment timeout', { bookingId });
        }
        break;
      }

      case 'payment_reconcile_sweep': {
        await paymentsService.reconcilePendingPayments();
        break;
      }

      case 'stay_overrun': {
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('booking_ref, rooms(room_number, status), guests(name, phone)')
          .eq('id', bookingId)
          .single();

        if (!booking) break;

        if (booking.rooms?.status === 'occupied') {
          await notificationService.notifyStayOverrun({
            bookingRef: booking.booking_ref,
            guestName:  booking.guests?.name,
            guestPhone: booking.guests?.phone,
            roomNumber: booking.rooms?.room_number,
          });
          logger.warn('Stay overrun alert sent', { bookingId });
        }
        break;
      }

      case 'cleaning_overrun': {
        const { data: room } = await supabaseAdmin
          .from('rooms')
          .select('room_number, status, cleaning_started_at')
          .eq('id', roomId)
          .single();

        if (!room) break;

        if (room.status === 'cleaning') {
          await notificationService.notifyCleaningOverrun({
            roomNumber:        room.room_number,
            cleaningStartedAt: room.cleaning_started_at,
          });
          logger.warn('Cleaning overrun alert sent', { roomId });
        }
        break;
      }

      default:
        logger.warn('Unknown timer type', { type, bookingId });
    }
  });

  // Safety-net sweep: catches any pending_payment booking whose frontend
  // polling stopped (tab closed, app backgrounded) before Monnify
  // confirmation was ever recorded. Runs independently of the per-booking
  // expiry timer above. Bull dedupes identical repeatable job definitions
  // across restarts, so this is safe to call on every boot.
  queue.add(
    { type: 'payment_reconcile_sweep' },
    { repeat: { every: config.timers.paymentReconcileIntervalMinutes * 60_000 } }
  ).catch((err) => {
    logger.error('Failed to schedule payment reconciliation sweep', { error: err.message });
  });

  // Rehydrate any jobs lost during a previous restart
  timersService.rehydrateTimers().catch((err) => {
    logger.error('Timer rehydration failed', { error: err.message });
  });

  logger.info('Timer worker started');
}

module.exports = { startTimerWorker };
