import api from './api';

export const authService = {
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('secureweb_token', res.data.token);
      localStorage.setItem('secureweb_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('secureweb_token', res.data.token);
      localStorage.setItem('secureweb_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    if (res.data.user) {
      localStorage.setItem('secureweb_user', JSON.stringify(res.data.user));
    }
    return res.data.user;
  },

  logout() {
    localStorage.removeItem('secureweb_token');
    localStorage.removeItem('secureweb_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('secureweb_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem('secureweb_token');
  },
};
