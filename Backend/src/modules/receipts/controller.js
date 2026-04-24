// src/modules/receipts/receipts.controller.js
'use strict';

const receiptsService = require('./receipts.service');

const controller = {
  async getByBooking(req, res) {
    const receipt = await receiptsService.getReceiptByBookingId(req.params.bookingId);
    res.json({ data: receipt });
  },
};

module.exports = controller;
