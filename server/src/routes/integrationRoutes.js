const express = require('express');
const integrationController = require('../controllers/integrationController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/wazuh/status', requireRole('Admin', 'Security Analyst'), async (req, res, next) => {
  try { res.json(await require('../services/wazuhService').status()); } catch (err) { next(err); }
});
router.post('/wazuh/setup', requireRole('Admin', 'Security Analyst'), async (req, res, next) => {
  try { res.json(await require('../services/wazuhService').setup(req.user.id, req.ip)); } catch (err) { next(err); }
});
router.get('/wazuh/connector', requireRole('Admin', 'Security Analyst'), (req, res) => {
  res.download(require('node:path').resolve(__dirname, '../../integrations/wazuh/custom-secureweb'), 'custom-secureweb');
});

router.get('/', integrationController.getAll);
router.post('/', requireRole('Admin', 'Security Analyst'), integrationController.create);
router.put('/:id', requireRole('Admin', 'Security Analyst'), integrationController.update);
router.delete('/:id', requireRole('Admin', 'Security Analyst'), integrationController.delete);
router.post('/:id/simulate', requireRole('Admin', 'Security Analyst'), integrationController.simulateEvent);

module.exports = router;
