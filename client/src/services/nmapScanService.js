import api from './api';

export const nmapScanService = {
  async list() { return (await api.get('/nmap-scans')).data; },
  async get(id) { return (await api.get(`/nmap-scans/${id}`)).data; },
  async start(payload) { return (await api.post('/nmap-scans', payload)).data; },
};
