const express = require('express');
const assetController = require('../controllers/assetController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Categories
router.get('/categories', assetController.getCategories);
router.get('/trash', requireRole('Admin', 'IT Manager'), async (req, res, next) => {
  try { res.json(await require('../services/assetService').getTrash()); } catch (err) { next(err); }
});
router.post('/trash/:id/restore', requireRole('Admin'), async (req, res, next) => {
  try { res.json(await require('../services/assetService').restoreAsset(req.params.id, req.user.id, req.ip)); } catch (err) { next(err); }
});
router.delete('/trash/:id', requireRole('Admin'), async (req, res, next) => {
  try { res.json(await require('../services/assetService').permanentlyDeleteAsset(req.params.id, req.body?.confirmAssetId, req.user.id, req.ip)); } catch (err) { next(err); }
});

// CRUD
router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);
router.post('/', requireRole('Admin', 'IT Manager'), assetController.create);
router.put('/:id', requireRole('Admin', 'IT Manager'), assetController.update);
router.delete('/:id', requireRole('Admin'), assetController.delete);

module.exports = router;
