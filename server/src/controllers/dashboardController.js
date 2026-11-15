const dashboardService = require('../services/dashboardService');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const data = await dashboardService.getStats();
      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
