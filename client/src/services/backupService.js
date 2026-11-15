import api from './api';

export const backupService = {
  async getBackups() {
    const res = await api.get('/backups');
    return res.data;
  },

  async getBackupById(id) {
    const res = await api.get(`/backups/${id}`);
    return res.data;
  },

  async getStats() {
    const res = await api.get('/backups/stats');
    return res.data;
  },

  async createBackup(data) {
    const res = await api.post('/backups', data);
    return res.data;
  },

  async restoreBackup(data) {
    const res = await api.post('/backups/restore', data);
    return res.data;
  },

  async deleteBackup(id) {
    const res = await api.delete(`/backups/${id}`);
    return res.data;
  },

  async verifyBackup(id) {
    const res = await api.post(`/backups/${id}/verify`);
    return res.data;
  },

  async getRecoveryHistory() {
    const res = await api.get('/backups/recovery/history');
    return res.data;
  },

  async getSettings() {
    const res = await api.get('/backups/settings/all');
    return res.data;
  },

  async upsertSetting(data) {
    const res = await api.put('/backups/settings/upsert', data);
    return res.data;
  },
};
