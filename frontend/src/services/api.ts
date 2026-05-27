import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@CampoLog:token');
    const unidadeAtiva = localStorage.getItem('@CampoLog:unidadeAtiva');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (unidadeAtiva) {
      config.headers['X-Unidade-ID'] = unidadeAtiva;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@CampoLog:token');
      localStorage.removeItem('@CampoLog:user');
      localStorage.removeItem('@CampoLog:unidadeAtiva');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
