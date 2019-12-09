"'use strict";
const express = require('express');
const router = express.Router();
const authHelper = require('../middleware/authHelper');

const sessions = require('../controllers/sessions');

router.post('/', sessions.createSessions);
router.delete('/:id', authHelper.checkAuth, sessions.deleteSession);

module.exports = router;