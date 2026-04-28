// src/modules/admin/admin.routes.js
'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { asyncHandler } = require('../../middleware/errorHandler');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const controller = require('./admin.controller');

const createUserRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 80 }).withMessage('Full name must be under 80 characters'),
  body('role')
    .trim()
    .isIn(['manager', 'front_desk'])
    .withMessage('Role must be manager or front_desk'),
];

const updateUserRules = [
  body('role')
    .optional()
    .isIn(['manager', 'front_desk'])
    .withMessage('Role must be manager or front_desk'),
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty')
    .isLength({ max: 80 }).withMessage('Full name must be under 80 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// GET  /api/admin/dashboard        — summary stats for owner/manager
// GET  /api/admin/users            — list admin users (owner only)
// POST /api/admin/users            — create admin user (owner only)
// PATCH /api/admin/users/:id       — update admin user (owner only)

router.get('/dashboard',
  requireRole('owner', 'manager'),
  asyncHandler(controller.dashboard)
);

router.get('/users',
  requireRole('owner'),
  asyncHandler(controller.listUsers)
);

router.post('/users',
  requireRole('owner'),
  createUserRules,
  validate,
  asyncHandler(controller.createUser)
);

router.patch('/users/:id',
  requireRole('owner'),
  updateUserRules,
  validate,
  asyncHandler(controller.updateUser)
);

router.patch('/users/:id/deactivate',
  requireRole('owner'),
  asyncHandler(controller.deactivateUser)
);

module.exports = router;
