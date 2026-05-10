// src/modules/timers/timers.worker.js
// ─────────────────────────────────────────────────────────────
// Bull worker that processes timer jobs when they fire.
// This runs in the same Node process — no separate worker needed.
// ─────────────────────────────────────────────────────────────
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
        // Stay has officially ended — no immediate action needed
        // The stay_overrun timer (set +1hr) handles the alert.
        // We update booking status for record keeping.
        await supabaseAdmin
          .from('bookings')
          .update({ status: 'checked_out' })
          .eq('id', bookingId);

        logger.info('Stay ended — booking marked checked_out', { bookingId });
        break;
      }

      case 'stay_overrun': {
        // 1 hour past checkout — check if room is still in_use
        const { data: booking } = await supabaseAdmin
          .from('bookings')
          .select('booking_ref, rooms(room_number, status), guests(name, phone)')
          .eq('id', bookingId)
          .single();

        if (!booking) break;

        const roomStatus = booking.rooms?.status;

        if (roomStatus === 'occupied') {
          // Room still occupied — alert owner
          await notificationService.notifyStayOverrun({
            bookingRef:  booking.booking_ref,
            guestName:   booking.guests?.name,
            guestPhone:  booking.guests?.phone,
            roomNumber:  booking.rooms?.room_number,
          });
          logger.warn('Stay overrun alert sent', { bookingId });
        }
        break;
      }

      case 'cleaning_overrun': {
        // 80 minutes into cleaning — check if still cleaning
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
