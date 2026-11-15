const riskService = require('../services/riskService');
const { riskSchema } = require('../validators/riskValidator');

class RiskController {
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        riskLevel: req.query.riskLevel,
        status: req.query.status,
        assetId: req.query.assetId,
      };
      const risks = await riskService.getAllRisks(filters);
      return res.json(risks);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const risk = await riskService.getRiskById(req.params.id);
      return res.json(risk);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validatedData = riskSchema.parse(req.body);
      const risk = await riskService.createRisk(validatedData, req.user.id, req.ip);
      return res.status(201).json(risk);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validatedData = riskSchema.parse(req.body);
      const risk = await riskService.updateRisk(req.params.id, validatedData, req.user.id, req.ip);
      return res.json(risk);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await riskService.deleteRisk(req.params.id, req.user.id, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMatrixStats(req, res, next) {
    try {
      const stats = await riskService.getMatrixStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RiskController();
