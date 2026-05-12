// src/modules/timers/timers.service.js
// ─────────────────────────────────────────────────────────────
// Schedules and cancels Bull jobs for all time-based events.
// ─────────────────────────────────────────────────────────────
'use strict';

const { getQueue } = require('../../lib/queue');
const { supabaseAdmin } = require('../../lib/supabase');
const { AppError } = require('../../middleware/errorHandler');
const config = require('../../config');
const logger = require('../../lib/logger');

const TIMER_QUEUE = 'timers';

const timersService = {

  /**
   * Schedule all timers for a confirmed booking.
   */
  async scheduleBookingTimers(bookingId, checkOutAt) {
    const checkOutDate = new Date(checkOutAt);
    const now          = Date.now();

    const jobs = [
      {
        type:   'stay_end',
        fireAt: checkOutDate,
        delay:  checkOutDate.getTime() - now,
      },
      {
        type:   'stay_overrun',
        fireAt: new Date(checkOutDate.getTime() + config.timers.stayOverrunMinutes * 60_000),
        delay:  checkOutDate.getTime() - now + config.timers.stayOverrunMinutes * 60_000,
      },
    ];

    for (const job of jobs) {
      if (job.delay <= 0) continue;
      await this._scheduleJob({ bookingId, type: job.type, fireAt: job.fireAt, delay: job.delay });
    }

    logger.info('Booking timers scheduled', { bookingId, checkOutAt });
  },

  /**
   * Schedule a cleaning overrun timer.
   * Cancels any existing cleaning timer for the same room first.
   */
  async scheduleCleaningTimer(roomId, bookingId, cleaningStartedAt) {
    // Cancel previous unfired cleaning timer to prevent duplicates
    await this.cancelCleaningTimersForRoom(roomId);

    const fireAt = new Date(
      cleaningStartedAt.getTime() + config.timers.cleaningOverrunMinutes * 60_000
    );
    const delay = fireAt.getTime() - Date.now();

    if (delay <= 0) return;

    await this._scheduleJob({
      bookingId,
      type:   'cleaning_overrun',
      fireAt,
      delay,
      roomId,
    });

    logger.info('Cleaning overrun timer scheduled', { roomId, bookingId, fireAt });
  },

  /**
   * Cancel all unfired cleaning_overrun timers for a specific room.
   */
  async cancelCleaningTimersForRoom(roomId) {
    const { data: timers } = await supabaseAdmin
      .from('timers')
      .select('id, bull_job_id')
      .eq('room_id', roomId)
      .eq('timer_type', 'cleaning_overrun')
      .eq('fired', false);

    if (!timers?.length) return;

    const queue = getQueue(TIMER_QUEUE);
    for (const timer of timers) {
      try {
        const job = await queue.getJob(timer.bull_job_id);
        if (job) await job.remove();
      } catch (err) {
        logger.warn('Could not remove old cleaning job', { jobId: timer.bull_job_id });
      }
    }

    await supabaseAdmin
      .from('timers')
      .update({ fired: true, fired_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('timer_type', 'cleaning_overrun')
      .eq('fired', false);
  },

  /**
   * Cancel all active timers for a booking (e.g. on cancellation).
   */
  async cancelBookingTimers(bookingId) {
    const { data: timers } = await supabaseAdmin
      .from('timers')
      .select('id, bull_job_id, timer_type')
      .eq('booking_id', bookingId)
      .eq('fired', false);

    if (!timers?.length) return;

    const queue = getQueue(TIMER_QUEUE);
    for (const timer of timers) {
      try {
        const job = await queue.getJob(timer.bull_job_id);
        if (job) await job.remove();
      } catch (err) {
        logger.warn('Could not remove Bull job', { jobId: timer.bull_job_id });
      }
    }

    await supabaseAdmin
      .from('timers')
      .update({ fired: true, fired_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('fired', false);

    logger.info('Booking timers cancelled', { bookingId });
  },

  /**
   * Re-queues any unfired timers on server startup.
   */
  async rehydrateTimers() {
    const { data: pendingTimers } = await supabaseAdmin
      .from('timers')
      .select('*')
      .eq('fired', false)
      .gt('fire_at', new Date().toISOString());

    if (!pendingTimers?.length) {
      logger.info('No pending timers to rehydrate');
      return;
    }

    const queue = getQueue(TIMER_QUEUE);

    for (const timer of pendingTimers) {
      if (timer.bull_job_id) {
        const existing = await queue.getJob(timer.bull_job_id);
        if (existing) continue;
      }

      const delay = new Date(timer.fire_at).getTime() - Date.now();
      if (delay <= 0) continue;

      const job = await queue.add(
        {
          bookingId: timer.booking_id,
          type:      timer.timer_type,
          roomId:    timer.room_id ?? undefined,
        },
        { delay, jobId: `rehydrated-${timer.id}` }
      );

      await supabaseAdmin
        .from('timers')
        .update({ bull_job_id: String(job.id) })
        .eq('id', timer.id);

      logger.info('Timer rehydrated', {
        timerId: timer.id,
        type:    timer.timer_type,
        roomId:  timer.room_id,
        delay,
      });
    }
  },

  // ── Internal helper ─────────────────────────────────────────

  async _scheduleJob({ bookingId, type, fireAt, delay, roomId = null }) {
    const queue = getQueue(TIMER_QUEUE);

    const jobData = { bookingId, type };
    if (roomId) jobData.roomId = roomId;

    const job = await queue.add(jobData, { delay });

    await supabaseAdmin
      .from('timers')
      .insert({
        booking_id:  bookingId,
        timer_type:  type,
        fire_at:     fireAt.toISOString(),
        bull_job_id: String(job.id),
        room_id:     roomId,
      });

    return job;
  },
};

module.exports = timersService;
