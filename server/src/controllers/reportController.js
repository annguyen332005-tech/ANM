const reportService = require('../services/reportService');

class ReportController {
  async getExecutiveReport(req, res, next) {
    try {
      const report = await reportService.getExecutiveReport();
      return res.json(report);
    } catch (error) {
      next(error);
    }
  }

  async exportData(req, res, next) {
    try {
      const { type } = req.params;
      const { format = 'json' } = req.query;
      const data = await reportService.exportData(type);

      if (format === 'csv') {
        if (!Array.isArray(data) || data.length === 0) {
          return res.send('');
        }
        // Simple CSV serializer
        const keys = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
        const header = keys.join(',');
        const rows = data.map((item) =>
          keys
            .map((k) => {
              const val = item[k] === null || item[k] === undefined ? '' : String(item[k]);
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        );
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="secureweb_${type}_export.csv"`);
        return res.send(`\uFEFF${header}\n${rows.join('\n')}`);
      }

      return res.json(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
