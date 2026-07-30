// src/modules/payments/payments.controller.js
'use strict';

const paymentsService = require('./payments.service');
const paymentStream = require('./paymentStream');
const logger = require('../../lib/logger');

const controller = {
  // Manual "check now" fallback — kept for clients that can't hold an
  // SSE connection open (some restrictive mobile networks/proxies do this).
  async poll(req, res) {
    const result = await paymentsService.pollPaymentStatus(req.params.paymentRef);
    res.json({ data: result });
  },

  // POST /api/payments/webhook — Monnify server-to-server notification.
  // Signature is verified here before anything is trusted.
  async webhook(req, res) {
    const signature = req.headers['monnify-signature'];
    const valid = paymentsService.verifyWebhookSignature(req.rawBody, signature);

    if (!valid) {
      logger.warn('Rejected Monnify webhook: invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const result = await paymentsService.handleWebhook(req.body);
    // Always 200 once signature is valid, even for ignored/duplicate
    // events — Monnify will retry on non-2xx, and retries of an already-
    // processed event are exactly what the idempotency check handles.
    res.status(200).json({ received: true, result });
  },

  // GET /api/payments/stream/:paymentRef — SSE push, replaces polling
  async stream(req, res) {
    const { paymentRef } = req.params;

    // Resolve current status immediately in case it's already decided
    // (e.g. guest reopened this page after an earlier webhook already
    // confirmed it) — don't make them wait for a new event that already happened.
    const current = await paymentsService.pollPaymentStatus(paymentRef);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(current)}\n\n`);

    const isFinal = ['confirmed', 'cancelled', 'incomplete_payment'].includes(current.status);
    if (isFinal) {
      res.end();
      return;
    }

    paymentStream.subscribe(paymentRef, res);

    // Keep the connection alive through Render/proxy idle timeouts
    const heartbeat = setInterval(() => {
      res.write(':heartbeat\n\n');
    }, 20_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      paymentStream.unsubscribe(paymentRef, res);
    });
  },

  async list(req, res) {
    const payments = await paymentsService.listPayments(req.query);
    res.json({ data: payments });
  },

  async getOne(req, res) {
    const payment = await paymentsService.getPaymentById(req.params.id);
    res.json({ data: payment });
  },
};

module.exports = controller;
