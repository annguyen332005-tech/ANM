const express = require('express');
const riskController = require('../controllers/riskController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/matrix', riskController.getMatrixStats);

router.get('/', riskController.getAll);
router.get('/:id', riskController.getById);
router.post('/', requireRole('Admin', 'Security Analyst', 'IT Manager'), riskController.create);
router.put('/:id', requireRole('Admin', 'Security Analyst', 'IT Manager'), riskController.update);
router.delete('/:id', requireRole('Admin'), riskController.delete);

module.exports = router;
