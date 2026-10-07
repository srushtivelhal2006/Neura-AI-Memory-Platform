import axios from 'axios';

const api = axios.create({
  baseURL: '/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('pragma_api_key');
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pragma_api_key');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
