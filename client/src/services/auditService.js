import api from './api';

export const auditService = {
  async getLogs(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.action && filters.action !== 'all') params.append('action', filters.action);
    if (filters.resource && filters.resource !== 'all') params.append('resource', filters.resource);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await api.get(`/audit-logs?${params.toString()}`);
    return res.data;
  },

  async getActions() {
    const res = await api.get('/audit-logs/actions');
    return res.data;
  },
};
