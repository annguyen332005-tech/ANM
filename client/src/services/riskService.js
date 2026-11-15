import api from './api';

export const riskService = {
  async getRisks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.riskLevel && filters.riskLevel !== 'all') params.append('riskLevel', filters.riskLevel);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.assetId && filters.assetId !== 'all') params.append('assetId', filters.assetId);

    const res = await api.get(`/risks?${params.toString()}`);
    return res.data;
  },

  async getRiskById(id) {
    const res = await api.get(`/risks/${id}`);
    return res.data;
  },

  async createRisk(data) {
    const res = await api.post('/risks', data);
    return res.data;
  },

  async updateRisk(id, data) {
    const res = await api.put(`/risks/${id}`, data);
    return res.data;
  },

  async deleteRisk(id) {
    const res = await api.delete(`/risks/${id}`);
    return res.data;
  },

  async getMatrixStats() {
    const res = await api.get('/risks/matrix');
    return res.data;
  },
};
