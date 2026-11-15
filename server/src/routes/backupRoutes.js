const express = require('express');
const backupController = require('../controllers/backupController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Stats
router.get('/stats', requireRole('Admin', 'IT Manager'), backupController.getStats);

// Backup CRUD
router.get('/', requireRole('Admin', 'IT Manager'), backupController.getAll);
router.get('/:id', requireRole('Admin', 'IT Manager'), backupController.getById);
router.post('/', requireRole('Admin'), backupController.createBackup);
router.delete('/:id', requireRole('Admin'), backupController.deleteBackup);
router.post('/:id/verify', requireRole('Admin', 'IT Manager'), backupController.verifyBackup);

// Restore
router.post('/restore', requireRole('Admin'), backupController.restoreBackup);

// Recovery history
router.get('/recovery/history', requireRole('Admin', 'IT Manager'), backupController.getRecoveryHistory);

// System settings
router.get('/settings/all', requireRole('Admin'), backupController.getAllSettings);
router.put('/settings/upsert', requireRole('Admin'), backupController.upsertSetting);

module.exports = router;
