import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('secureweb_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If Backend server is down or proxy returns HTML/500/504
    if (!error.response) {
      error.friendlyMessage = 'Không thể kết nối đến máy chủ Backend (Port 4000). Vui lòng đảm bảo server backend đang chạy.';
    } else if (typeof error.response.data === 'string' || error.response.status >= 500) {
      error.friendlyMessage = `Lỗi máy chủ (${error.response.status}). Vui lòng kiểm tra trạng thái Backend.`;
    } else {
      error.friendlyMessage = error.response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    }

    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('secureweb_token');
      localStorage.removeItem('secureweb_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
