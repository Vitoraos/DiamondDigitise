// src/middleware/validate.js
// ─────────────────────────────────────────────────────────────
// Collects express-validator errors and returns a structured 400
// before the controller ever runs.
//
// Usage:
//   const { body } = require('express-validator');
//   router.post('/', [
//     body('name').trim().notEmpty().withMessage('Name is required'),
//     validate,
//     controller.create,
//   ]);
// ─────────────────────────────────────────────────────────────
'use strict';

const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      fields: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = { validate };
