// src/modules/notifications/notifications.service.js
// ─────────────────────────────────────────────────────────────
// All Telegram notifications go through here.
// A single bot instance is reused across the process lifetime.
// ─────────────────────────────────────────────────────────────
'use strict';

const TelegramBot = require('node-telegram-bot-api');
const config = require('../../config');
const logger = require('../../lib/logger');

// Singleton bot instance — polling: false because we only send
let bot = null;

function getBot() {
  if (!bot) {
    bot = new TelegramBot(config.telegram.botToken, { polling: false });
  }
  return bot;
}

async function sendToOwner(message) {
  try {
    await getBot().sendMessage(config.telegram.ownerChatId, message, {
      parse_mode: 'Markdown',
    });
    logger.info('Telegram notification sent to owner');
  } catch (err) {
    // Notification failure must never crash the main flow
    logger.error('Telegram notification failed', { error: err.message });
  }
}

const notificationService = {

  async notifyStayOverrun({ bookingRef, guestName, guestPhone, roomNumber }) {
    const msg =
      `⚠️ *Stay Overrun Alert*\n\n` +
      `Room *${roomNumber}* is still occupied 1 hour after checkout.\n\n` +
      `Booking: \`${bookingRef}\`\n` +
      `Guest: ${guestName} (${guestPhone})\n\n` +
      `Please follow up with the guest.`;

    await sendToOwner(msg);
  },

  async notifyCleaningOverrun({ roomNumber, cleaningStartedAt }) {
    const started = new Date(cleaningStartedAt).toLocaleTimeString('en-NG', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const msg =
      `🧹 *Cleaning Overrun Alert*\n\n` +
      `Room *${roomNumber}* has been in cleaning status for over 80 minutes.\n` +
      `Cleaning started: ${started}\n\n` +
      `Please check on the cleaning status.`;

    await sendToOwner(msg);
  },

  async notifyIncompletePayment({ bookingRef, amountExpected, amountReceived, shortfall, refundAmount }) {
    const msg =
      `❌ *Incomplete Payment*\n\n` +
      `Booking: \`${bookingRef}\`\n` +
      `Expected: ₦${amountExpected.toLocaleString()}\n` +
      `Received: ₦${amountReceived.toLocaleString()}\n` +
      `Shortfall: ₦${shortfall.toLocaleString()}\n\n` +
      `A refund of ₦${refundAmount.toLocaleString()} has been initiated (after ₦50 processing fee).`;

    await sendToOwner(msg);
  },

  async notifyNewBooking({ bookingRef, guestName, roomNumber, totalAmount, numNights }) {
    const msg =
      `✅ *New Booking Confirmed*\n\n` +
      `Room *${roomNumber}* — ${numNights} night(s)\n` +
      `Guest: ${guestName}\n` +
      `Amount: ₦${totalAmount.toLocaleString()}\n` +
      `Ref: \`${bookingRef}\``;

    await sendToOwner(msg);
  },
};

module.exports = notificationService;
