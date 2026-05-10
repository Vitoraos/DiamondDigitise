// src/modules/admin/admin.controller.js
'use strict';

// ✅ FIX: was require('./admin.service') — file is actually adminService.js
const adminService = require('./adminService');

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
