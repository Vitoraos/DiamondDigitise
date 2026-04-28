// src/modules/bookings/bookings.controller.js
'use strict';

const bookingsService = require('./bookingsService');

const controller = {
  async list(req, res) {
    const bookings = await bookingsService.listBookings();
    res.json({ data: bookings });
  },

  async getOne(req, res) {
    const booking = await bookingsService.getBookingById(req.params.id);
    res.json({ data: booking });
  },

  async create(req, res) {
    const booking = await bookingsService.createBooking(req.body);
    res.status(201).json({ data: booking });
  },

  async verify(req, res) {
    const result = await bookingsService.verifyBooking(
      req.params.id,
      req.user
    );
    res.json({ data: result });
  },

  async cancel(req, res) {
    const booking = await bookingsService.cancelBooking(
      req.params.id,
      req.user
    );
    res.json({ data: booking });
  },
};

module.exports = controller;
