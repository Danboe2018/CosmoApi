const express = require('express');
const router = express.Router();
const authHelper = require('../middleware/authHelper')

const users = require('../controllers/users');

router.post('/', users.createUser);
router.delete('/:id', authHelper.checkAuth, users.deleteUser);
router.get('/:id', authHelper.checkAuth, users.loginUser);

module.exports = router;