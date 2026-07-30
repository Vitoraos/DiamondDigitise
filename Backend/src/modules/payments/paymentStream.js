// src/modules/payments/paymentStream.js
// ─────────────────────────────────────────────────────────────
// In-memory SSE client registry, keyed by payment_ref. Replaces
// frontend polling: the webhook handler (or the reconciliation
// sweep, or the expiry timer) calls publish() once, and every open
// tab watching that paymentRef gets the update immediately.
//
// CAVEAT: this only works within a single backend process. If this
// service ever runs as multiple replicas, a webhook landing on one
// instance won't reach a client connected to another. Swap this for
// Redis pub/sub (ioredis publish/subscribe on a 'payments' channel)
// if that ever becomes true — same interface, no caller changes needed.
// ─────────────────────────────────────────────────────────────
'use strict';

const logger = require('../../lib/logger');

const clients = new Map(); // paymentRef -> Set<res>

function subscribe(paymentRef, res) {
  if (!clients.has(paymentRef)) clients.set(paymentRef, new Set());
  clients.get(paymentRef).add(res);
}

function unsubscribe(paymentRef, res) {
  const set = clients.get(paymentRef);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(paymentRef);
}

function publish(paymentRef, data) {
  const set = clients.get(paymentRef);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try {
      res.write(payload);
    } catch (err) {
      logger.warn('SSE write failed, dropping client', { paymentRef, error: err.message });
    }
  }
}

module.exports = { subscribe, unsubscribe, publish };
