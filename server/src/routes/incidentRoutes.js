const express = require('express');
const incidentController = require('../controllers/incidentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', incidentController.getStats);

router.get('/', incidentController.getAll);
router.get('/:id', incidentController.getById);

router.post('/', requireRole('Admin', 'Security Analyst', 'IT Manager'), incidentController.create);
router.put('/:id', requireRole('Admin', 'Security Analyst', 'IT Manager'), incidentController.update);
router.delete('/:id', requireRole('Admin'), incidentController.delete);

// Actions & Response
router.post('/:id/actions', requireRole('Admin', 'Security Analyst', 'IT Manager'), incidentController.addAction);
router.post('/:id/respond', (req, res, next) => {
  const roles = ['BLOCK_IP', 'UNBLOCK_IP'].includes(req.body?.actionType) ? ['Admin'] : ['Admin', 'Security Analyst'];
  return requireRole(...roles)(req, res, next);
}, incidentController.executeResponse);

module.exports = router;
