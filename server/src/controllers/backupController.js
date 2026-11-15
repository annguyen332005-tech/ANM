const backupService = require('../services/backupService');
const { backupSchema, restoreSchema, systemSettingSchema } = require('../validators/backupValidator');

class BackupController {
  // ─── Backups ──────────────────────────────────────────────────────────────

  async getAll(req, res, next) {
    try {
      const backups = await backupService.getAllBackups();
      return res.json({ backups });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const backup = await backupService.getBackupById(req.params.id);
      return res.json({ backup });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await backupService.getStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async createBackup(req, res, next) {
    try {
      const validatedData = backupSchema.parse(req.body);
      const backup = await backupService.createBackup(validatedData, req.user.id, req.ip);
      return res.status(201).json({ backup, message: 'Backup tạo thành công.' });
    } catch (error) {
      next(error);
    }
  }

  async restoreBackup(req, res, next) {
    try {
      const validatedData = restoreSchema.parse(req.body);
      const result = await backupService.restoreBackup(validatedData.backupId, validatedData, req.user.id, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteBackup(req, res, next) {
    try {
      const result = await backupService.deleteBackup(req.params.id, req.user.id, req.ip);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyBackup(req, res, next) {
    try {
      const result = await backupService.verifyBackup(req.params.id);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ─── Recovery History ─────────────────────────────────────────────────────

  async getRecoveryHistory(req, res, next) {
    try {
      const history = await backupService.getRecoveryHistory();
      return res.json({ history });
    } catch (error) {
      next(error);
    }
  }

  // ─── System Settings ──────────────────────────────────────────────────────

  async getAllSettings(req, res, next) {
    try {
      const settings = await backupService.getAllSettings();
      return res.json({ settings });
    } catch (error) {
      next(error);
    }
  }

  async upsertSetting(req, res, next) {
    try {
      const { key, value, category } = systemSettingSchema.parse(req.body);
      const setting = await backupService.upsertSetting(key, value, category, req.user.id, req.ip);
      return res.json({ setting });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BackupController();
