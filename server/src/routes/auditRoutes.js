const express = require('express');
const auditController = require('../controllers/auditController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('Admin', 'Security Analyst'));

router.get('/actions', auditController.getActions);
router.get('/', auditController.getAll);

module.exports = router;
