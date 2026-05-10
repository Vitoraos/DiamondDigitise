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

  // ✅ FIX: was missing entirely — router calls this for GET /ref/:ref
  async getByRef(req, res) {
    const booking = await bookingsService.getBookingByRef(req.params.ref);
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

  // ✅ FIX: was defined outside the controller object — now correctly inside
  async checkout(req, res) {
    const result = await bookingsService.checkoutBooking(
      req.params.id,
      req.user
    );
    res.json({ data: result });
  },
};

module.exports = controller;
