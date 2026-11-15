import api from './api';

export const reportService = {
  async getExecutiveReport() {
    const res = await api.get('/reports/executive');
    return res.data;
  },

  async exportData(type, format = 'json') {
    if (format === 'csv') {
      const res = await api.get(`/reports/export/${type}`, {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `secureweb_${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    }

    const res = await api.get(`/reports/export/${type}`);
    // Download as JSON
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `secureweb_${type}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return res.data;
  },
};
