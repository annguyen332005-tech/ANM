const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Executive Security Report
router.get('/executive', requireRole('Admin', 'Security Analyst', 'IT Manager'), reportController.getExecutiveReport);

// Data Export
router.get('/export/:type', requireRole('Admin', 'Security Analyst', 'IT Manager'), reportController.exportData);

module.exports = router;
