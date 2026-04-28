// src/modules/admin/admin.controller.js
'use strict';

const adminService = require('./admin.service');

const controller = {
  async dashboard(req, res) {
    const stats = await adminService.getDashboardStats();
    res.json({ data: stats });
  },
  async listUsers(req, res) {
    const users = await adminService.listAdminUsers();
    res.json({ data: users });
  },
  async createUser(req, res) {
    const user = await adminService.createAdminUser(req.body, req.user);
    res.status(201).json({ data: user });
  },
  async updateUser(req, res) {
    const user = await adminService.updateAdminUser(req.params.id, req.body, req.user);
    res.json({ data: user });
  },

  async deactivateUser(req, res) {
    const user = await adminService.deactivateUser(req.params.id, req.user);
    res.json({ data: user });
  },
};

module.exports = controller;
