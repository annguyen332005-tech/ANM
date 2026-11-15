import api from './api';

export const integrationService = {
  async getIntegrations() {
    const res = await api.get('/integrations');
    return res.data;
  },

  async createIntegration(data) {
    const res = await api.post('/integrations', data);
    return res.data;
  },

  async updateIntegration(id, data) {
    const res = await api.put(`/integrations/${id}`, data);
    return res.data;
  },

  async deleteIntegration(id) {
    const res = await api.delete(`/integrations/${id}`);
    return res.data;
  },

  async simulateEvent(id, data) {
    const res = await api.post(`/integrations/${id}/simulate`, data);
    return res.data;
  },
};
