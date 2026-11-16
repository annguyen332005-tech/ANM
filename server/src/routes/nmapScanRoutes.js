const express = require('express');
const { z } = require('zod');
const { authenticateToken, requireRole } = require('../middleware/auth');
const scans = require('../services/nmapScanService');
const router = express.Router();
router.use(authenticateToken, requireRole('Admin', 'Security Analyst'));
router.get('/', async (req, res, next) => {
  try { res.json(await scans.list()); } catch (err) { next(err); }
});
router.get('/:id', async (req, res, next) => {
  try { res.json(await scans.get(req.params.id)); } catch (err) { next(err); }
});
router.post('/', async (req, res, next) => {
  try {
    const body = z.object({ assetId: z.string().min(1), ports: z.string().max(600).optional() }).parse(req.body);
    res.status(202).json(await scans.start(body, req.user.id, req.ip));
  } catch (err) { next(err); }
});
module.exports = router;
