// src/server.js
// ─────────────────────────────────────────────────────────────
// Entry point. Creates the Express app, starts listening,
// registers graceful shutdown handlers.
// ─────────────────────────────────────────────────────────────
'use strict';

const { createApp } = require('./app');
const config = require('./config');
const logger = require('./lib/logger');
const { closeAllQueues } = require('./lib/queue');
const { startTimerWorker } = require('./modules/timers/timers.worker');

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`🏨  Hotel backend running`, {
    port: config.port,
    env: config.env,
  });
});

// Start Bull worker for timer jobs
startTimerWorker();

// ── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    try {
      await closeAllQueues();
      logger.info('Server closed cleanly');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced exit after 10s timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
