const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('Admin', 'IT Manager'), userController.getAll);

module.exports = router;
