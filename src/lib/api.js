import axios from 'axios';

// Configuração SIMPLIFICADA
const isBrowser = typeof window !== 'undefined';

const api = axios.create({
  baseURL: isBrowser ? '/api' : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isBrowser) {
      console.log('API Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data
      });

      // Erro de rede ou CORS
      if (!error.response) {
        console.error('Network/CORS Error:', error.message);
        return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
      }

      // Token expirado
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;