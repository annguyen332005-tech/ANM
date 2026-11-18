import api from './api';

export const assetService = {
  async getTrash() { return (await api.get('/assets/trash')).data; },
  async restoreAsset(id) { return (await api.post(`/assets/trash/${id}/restore`)).data; },
  async permanentlyDeleteAsset(id, confirmAssetId) {
    return (await api.delete(`/assets/trash/${id}`, { data: { confirmAssetId } })).data;
  },
  async getAssets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.criticality && filters.criticality !== 'all') params.append('criticality', filters.criticality);
    if (filters.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);

    const res = await api.get(`/assets?${params.toString()}`);
    return res.data;
  },

  async getAssetById(id) {
    const res = await api.get(`/assets/${id}`);
    return res.data;
  },

  async createAsset(data) {
    const res = await api.post('/assets', data);
    return res.data;
  },

  async updateAsset(id, data) {
    const res = await api.put(`/assets/${id}`, data);
    return res.data;
  },

  async deleteAsset(id) {
    const res = await api.delete(`/assets/${id}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/assets/categories');
    return res.data;
  },
};
