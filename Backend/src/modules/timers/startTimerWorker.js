// src/modules/timers/timers.worker.js
'use strict';

const { getQueue } = require('../../lib/queue');
const { supabaseAdmin } = require('../../lib/supabase');
const logger = require('../../lib/logger');
const notificationService = require('../notifications/notificationService');
const timersService = require('./timersService');

function startTimerWorker() {
  const queue = getQueue('timers');

  queue.process(async (job) => {
    const { bookingId, type, roomId } = job.data;
    logger.info('Timer fired', { bookingId, type });

    // Mark as fired in DB
    await supabaseAdmin
      .from('timers')
      .update({ fired: true, fired_at: new Date().toISOString() })
      .eq('bull_job_id', String(job.id));

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
    .select('status')
    .eq('id', bookingId)
    .single();

  // Only cancel if still pending — don't cancel if already confirmed
  if (booking?.status === 'pending') {
    await supabaseAdmin.from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    await supabaseAdmin.from('rooms')
      .update({ status: 'available' })
      .eq('id', booking.room_id);
    logger.info('Booking auto-cancelled: payment timeout', { bookingId });
  }
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

  // Rehydrate any jobs lost during a previous restart
  timersService.rehydrateTimers().catch((err) => {
    logger.error('Timer rehydration failed', { error: err.message });
  });

  logger.info('Timer worker started');
}

module.exports = { startTimerWorker };
