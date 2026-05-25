'use strict';
const receiptsService = require('./receipts.service');

const controller = {
  async list(req, res) {
    const receipts = await receiptsService.listReceipts();
    res.json({ data: receipts });
  },
  async getByBooking(req, res) {
    const receipt = await receiptsService.getReceiptByBookingId(req.params.bookingId);
    res.json({ data: receipt });
  },
};

module.exports = controller;
