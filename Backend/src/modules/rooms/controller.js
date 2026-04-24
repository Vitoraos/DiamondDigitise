// src/modules/rooms/rooms.controller.js
'use strict';

const roomsService = require('./rooms.service');

const controller = {
  async list(req, res) {
    const rooms = await roomsService.getAllRooms();
    res.json({ data: rooms });
  },

  async listCategories(req, res) {
    const categories = await roomsService.getCategories();
    res.json({ data: categories });
  },

  async getOne(req, res) {
    const room = await roomsService.getRoomById(req.params.id);
    res.json({ data: room });
  },

  async create(req, res) {
    const room = await roomsService.createRoom(req.body);
    res.status(201).json({ data: room });
  },

  async update(req, res) {
    const room = await roomsService.updateRoom(req.params.id, req.body);
    res.json({ data: room });
  },

  async updateStatus(req, res) {
    const room = await roomsService.updateRoomStatus(
      req.params.id,
      req.body.status,
      req.body.cleaning_eta_minutes,
      req.user
    );
    res.json({ data: room });
  },

  async remove(req, res) {
    await roomsService.deleteRoom(req.params.id);
    res.status(204).send();
  },
};

module.exports = controller;
