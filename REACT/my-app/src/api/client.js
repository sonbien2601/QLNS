import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      window.location.assign('/login');
    }
    return Promise.reject(Object.assign(new Error(message), { status, data: error.response?.data }));
  }
);

export default client;
