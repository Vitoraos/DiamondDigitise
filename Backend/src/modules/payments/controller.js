// src/modules/payments/payments.controller.js
'use strict';

const paymentsService = require('./payments.service');

const controller = {
  // Frontend polls this every 5 seconds while guest is on the payment page
  async poll(req, res) {
    const result = await paymentsService.pollPaymentStatus(req.params.paymentRef);
    res.json({ data: result });
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
