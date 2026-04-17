import axios from 'axios';

// Cria a instância base apontando para o nosso Django
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// 1. Interceptor de Requisição: Anexa o "crachá" (Access Token)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Interceptor de Resposta: Renova o "crachá" se ele expirar (Erro 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Se deu erro de Autorização e ainda não tentamos dar refresh
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh');

            if (refreshToken) {
                try {
                    // Pede um novo access token para o Django
                    const response = await axios.post('http://127.0.0.1:8000/api/accounts/refresh/', {
                        refresh: refreshToken
                    });

                    // Guarda o novo token no navegador
                    localStorage.setItem('access', response.data.access);

                    // Atualiza a requisição original com o novo token e tenta de novo
                    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Se o refresh token também expirou (ficou muito tempo sem usar o app), desloga de vez
                    localStorage.removeItem('access');
                    localStorage.removeItem('refresh');
                    window.location.href = '/login'; 
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;