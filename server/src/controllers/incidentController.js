const incidentService = require('../services/incidentService');
const { incidentSchema, incidentActionSchema } = require('../validators/incidentValidator');

class IncidentController {
  async getAll(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        type: req.query.type,
        severity: req.query.severity,
        status: req.query.status,
        assetId: req.query.assetId,
      };
      const incidents = await incidentService.getAllIncidents(filters);
      return res.json(incidents);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const incident = await incidentService.getIncidentById(req.params.id);
      return res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const validatedData = incidentSchema.parse(req.body);
      const incident = await incidentService.createIncident(validatedData, req.user.id, req.ip);
      return res.status(201).json(incident);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validatedData = incidentSchema.parse(req.body);
      const incident = await incidentService.updateIncident(req.params.id, validatedData, req.user.id, req.ip);
      return res.json(incident);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await incidentService.deleteIncident(req.params.id, req.user.id, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async addAction(req, res, next) {
    try {
      const validatedData = incidentActionSchema.parse(req.body);
      const action = await incidentService.addAction(req.params.id, validatedData, req.user.id, req.ip);
      return res.status(201).json(action);
    } catch (error) {
      next(error);
    }
  }

  async executeResponse(req, res, next) {
    try {
      const { actionType, notes, reason, targetIp } = req.body;
      if (!actionType) {
        return res.status(400).json({ message: 'Vui lòng chọn loại hành động phản ứng.' });
      }
      const combinedNotes = reason || notes || '';
      const updatedIncident = await incidentService.executeResponseAction(
        req.params.id,
        { actionType, notes: combinedNotes, targetIp },
        req.user.id,
        req.ip
      );
      return res.json(updatedIncident);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await incidentService.getStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IncidentController();
