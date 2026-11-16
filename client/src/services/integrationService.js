import api from './api';

export const integrationService = {
  async getWazuhStatus() { return (await api.get('/integrations/wazuh/status')).data; },
  async setupWazuh() { return (await api.post('/integrations/wazuh/setup')).data; },
  async downloadWazuhConnector() {
    const response = await api.get('/integrations/wazuh/connector', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'custom-secureweb'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
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
