// src/modules/rooms/rooms.routes.js
'use strict';

const { Router } = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const controller = require('./controller');

const router = Router();

// ── Public ───────────────────────────────────────────────────
// GET /api/rooms                    — list all rooms with category + status
// GET /api/rooms/categories         — list categories with prices
// GET /api/rooms/:id                — single room detail
router.get('/',            asyncHandler(controller.list));
router.get('/categories',  asyncHandler(controller.listCategories));
router.get('/:id',         asyncHandler(controller.getOne));

// ── Admin: any authenticated admin ───────────────────────────
// PATCH /api/rooms/:id/status       — update room status (available/in_use/cleaning)
router.patch(
  '/:id/status',
  requireAuth,
  asyncHandler(controller.updateStatus)
);

// ── Owner / Manager only ─────────────────────────────────────
// POST   /api/rooms                 — create a new room
// PATCH  /api/rooms/:id             — update room details
// DELETE /api/rooms/:id             — remove a room
router.post(
  '/',
  requireAuth,
  requireRole('owner', 'manager'),
  asyncHandler(controller.create)
);

router.patch(
  '/:id',
  requireAuth,
  requireRole('owner', 'manager'),
  asyncHandler(controller.update)
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('owner', 'manager'),
  asyncHandler(controller.remove)
);

module.exports = router;
