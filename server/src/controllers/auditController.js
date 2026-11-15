const auditService = require('../services/auditService');

class AuditController {
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        action: req.query.action,
        resource: req.query.resource,
        status: req.query.status,
        page: req.query.page,
        limit: req.query.limit,
      };
      const result = await auditService.getAllLogs(filters);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getActions(req, res, next) {
    try {
      const actions = await auditService.getActions();
      return res.json(actions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
