const integrationService = require('../services/integrationService');
const { integrationSchema } = require('../validators/integrationValidator');

class IntegrationController {
  async getAll(req, res, next) {
    try {
      const integrations = await integrationService.getAllIntegrations();
      return res.json({ integrations });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validatedData = integrationSchema.parse(req.body);
      const integration = await integrationService.createIntegration(validatedData, req.user.id, req.ip);
      return res.status(201).json(integration);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validatedData = integrationSchema.parse(req.body);
      const integration = await integrationService.updateIntegration(req.params.id, validatedData, req.user.id, req.ip);
      return res.json(integration);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await integrationService.deleteIntegration(req.params.id, req.user.id, req.ip);
      return res.json({ message: 'Đã xóa tích hợp.' });
    } catch (error) {
      next(error);
    }
  }

  async simulateEvent(req, res, next) {
    try {
      const result = await integrationService.simulateEvent(req.params.id, req.body, req.user.id, req.ip);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IntegrationController();
