
const express = require('express');
const router = express.Router();
const { getAll } = require('./categories.controller');

router.get('/', getAll);

module.exports = router;
