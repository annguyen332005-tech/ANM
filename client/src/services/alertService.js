import api from './api';

export const alertService = {
  async getAlerts(params = {}) {
    const res = await api.get('/alerts', { params });
    return res.data;
  },

  async updateStatus(id, status) {
    const res = await api.patch(`/alerts/${id}/status`, { status });
    return res.data;
  },

  async promoteToIncident(id) {
    const res = await api.post(`/alerts/${id}/promote`);
    return res.data;
  },

  async getStats() {
    const res = await api.get('/alerts/stats');
    return res.data;
  },
};
