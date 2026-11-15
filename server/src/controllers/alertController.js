const alertService = require('../services/alertService');
const { alertSchema, alertStatusUpdateSchema } = require('../validators/alertValidator');

class AlertController {
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        severity: req.query.severity,
        status: req.query.status,
      };
      const alerts = await alertService.getAllAlerts(filters);
      return res.json(alerts);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const alert = await alertService.getAlertById(req.params.id);
      return res.json(alert);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = alertStatusUpdateSchema.parse(req.body);
      const updated = await alertService.updateStatus(req.params.id, status, req.user.id, req.ip);
      return res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async promoteToIncident(req, res, next) {
    try {
      const incident = await alertService.promoteToIncident(req.params.id, req.user.id, req.ip);
      return res.status(201).json({ incident, message: 'Đã tạo sự cố thành công từ cảnh báo.' });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await alertService.getStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AlertController();
