const express = require('express');
const assetController = require('../controllers/assetController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Categories
router.get('/categories', assetController.getCategories);

// CRUD
router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);
router.post('/', requireRole('Admin', 'IT Manager'), assetController.create);
router.put('/:id', requireRole('Admin', 'IT Manager'), assetController.update);
router.delete('/:id', requireRole('Admin'), assetController.delete);

module.exports = router;
