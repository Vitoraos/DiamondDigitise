// src/config/index.js
// ─────────────────────────────────────────────────────────────
// Centralised config with startup validation.
// If a required variable is missing the server refuses to start —
// better to crash early than fail silently mid-request.
// ─────────────────────────────────────────────────────────────
'use strict';

require('dotenv').config();

const REQUIRED = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'MONNIFY_API_KEY',
  'MONNIFY_SECRET_KEY',
  'MONNIFY_CONTRACT_CODE',
  'MONNIFY_ACCOUNT_NUMBER',
  'MONNIFY_BANK_NAME',
  'MONNIFY_ACCOUNT_NAME',
  'MONNIFY_BASE_URL',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_OWNER_CHAT_ID',
  'REDIS_URL',
];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('❌  Missing required environment variables:');
    missing.forEach((k) => console.error(`   • ${k}`));
    process.exit(1);
  }
}

validateEnv();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  isDev: process.env.NODE_ENV !== 'production',

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },

  monnify: {
    apiKey: process.env.MONNIFY_API_KEY,
    secretKey: process.env.MONNIFY_SECRET_KEY,
    contractCode: process.env.MONNIFY_CONTRACT_CODE,
    accountNumber: process.env.MONNIFY_ACCOUNT_NUMBER,
    bankName: process.env.MONNIFY_BANK_NAME,
    accountName: process.env.MONNIFY_ACCOUNT_NAME,
    baseUrl: process.env.MONNIFY_BASE_URL,
    refundFeeKobo: parseInt(process.env.MONNIFY_REFUND_FEE || '5000', 10),
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    ownerChatId: process.env.TELEGRAM_OWNER_CHAT_ID,
  },

  redis: {
    url: process.env.REDIS_URL,
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },

  booking: {
    refPrefix: process.env.BOOKING_REF_PREFIX || 'HTL',
    receiptPrefix: process.env.RECEIPT_REF_PREFIX || 'RCP',
  },

  timers: {
    stayOverrunMinutes: 60,      // alert owner 1 hr after checkout
    cleaningOverrunMinutes: 80,  // alert owner after 80 min cleaning
    paymentExpiryMinutes: parseInt(process.env.PAYMENT_EXPIRY_MINUTES || '12', 10),
    paymentReconcileIntervalMinutes: parseInt(process.env.PAYMENT_RECONCILE_INTERVAL_MINUTES || '2', 10),
  },
};

module.exports = config;
