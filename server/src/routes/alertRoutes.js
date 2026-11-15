const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', alertController.getStats);

router.get('/', alertController.getAll);
router.get('/:id', alertController.getById);

router.patch('/:id/status', requireRole('Admin', 'Security Analyst'), alertController.updateStatus);
router.post('/:id/promote', requireRole('Admin', 'Security Analyst'), alertController.promoteToIncident);

module.exports = router;
