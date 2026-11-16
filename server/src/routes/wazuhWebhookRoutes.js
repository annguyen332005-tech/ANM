const express = require('express');
const rateLimit = require('express-rate-limit');
const wazuh = require('../services/wazuhService');
const router = express.Router();
// Separate quota: ingest must not exhaust the interactive application's limiter.
router.use(rateLimit({ windowMs: 60000, limit: 120, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Quá nhiều cảnh báo Wazuh; thử lại sau.' } }));
router.post('/', wazuh.authorize, async (req, res, next) => {
  try {
    const result = await wazuh.ingest(req.body, req.ip);
    res.status(result.duplicate ? 200 : 201).json(result);
  } catch (err) { next(err); }
});
module.exports = router;
