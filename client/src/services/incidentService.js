import api from './api';

export const incidentService = {
  async getIncidents(params = {}) {
    const res = await api.get('/incidents', { params });
    return res.data;
  },

  async getIncidentById(id) {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
  },

  async createIncident(data) {
    const res = await api.post('/incidents', data);
    return res.data;
  },

  async updateIncident(id, data) {
    const res = await api.put(`/incidents/${id}`, data);
    return res.data;
  },

  async deleteIncident(id) {
    const res = await api.delete(`/incidents/${id}`);
    return res.data;
  },

  async addAction(id, data) {
    const res = await api.post(`/incidents/${id}/actions`, data);
    return res.data;
  },

  async executeResponse(id, data) {
    const res = await api.post(`/incidents/${id}/respond`, data);
    return res.data;
  },

  async getStats() {
    const res = await api.get('/incidents/stats');
    return res.data;
  },
};
