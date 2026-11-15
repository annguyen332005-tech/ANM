const express = require('express');
const integrationController = require('../controllers/integrationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', integrationController.getAll);
router.post('/', requireRole('Admin', 'Security Analyst'), integrationController.create);
router.put('/:id', requireRole('Admin', 'Security Analyst'), integrationController.update);
router.delete('/:id', requireRole('Admin', 'Security Analyst'), integrationController.delete);
router.post('/:id/simulate', requireRole('Admin', 'Security Analyst'), integrationController.simulateEvent);

module.exports = router;
