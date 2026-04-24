// src/lib/queue.js
// ─────────────────────────────────────────────────────────────
// Bull queue factory backed by Redis.
// All timer jobs (stay_end, stay_overrun, cleaning_overrun)
// go through queues created here.
//
// Usage:
//   const { getQueue } = require('../lib/queue');
//   const timerQueue = getQueue('timers');
//   await timerQueue.add({ bookingId, type }, { delay: ms });
// ─────────────────────────────────────────────────────────────
'use strict';

const Bull = require('bull');
const config = require('../config');
const logger = require('./logger');

// Cache queues so we don't create duplicate connections
const queues = new Map();

function getQueue(name) {
  if (queues.has(name)) return queues.get(name);

  const queue = new Bull(name, config.redis.url, {
    defaultJobOptions: {
      removeOnComplete: 100,  // keep last 100 completed jobs for debugging
      removeOnFail: 200,      // keep last 200 failed jobs
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  });

  queue.on('error', (err) => {
    logger.error(`Queue [${name}] error`, { error: err.message });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Queue [${name}] job failed`, {
      jobId: job.id,
      data: job.data,
      error: err.message,
      attempts: job.attemptsMade,
    });
  });

  queues.set(name, queue);
  return queue;
}

async function closeAllQueues() {
  for (const [name, queue] of queues) {
    await queue.close();
    logger.info(`Queue [${name}] closed`);
  }
}

module.exports = { getQueue, closeAllQueues };
