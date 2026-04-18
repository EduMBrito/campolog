import api from './api';

export const cadernoService = {
    getRegistos: () => api.get('/caderno/diario/'),
    createRegisto: (data: { ciclo: number, tipo: string, descricao: string, quantidade?: string }) => api.post('/caderno/diario/', data),
    updateRegisto: (id: number, data: { ciclo: number, tipo: string, descricao: string, quantidade?: string }) => api.put(`/caderno/diario/${id}/`, data),
    deleteRegisto: (id: number) => api.delete(`/caderno/diario/${id}/`),
};