import api from './api';

export const cadernoService = {
    getRegistos: () => api.get('/caderno/diario/'),
    
    // Mudamos 'data' para receber FormData
    createRegisto: (formData: FormData) => api.post('/caderno/diario/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    updateRegisto: (id: number, formData: FormData) => api.put(`/caderno/diario/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
    deleteRegisto: (id: number) => api.delete(`/caderno/diario/${id}/`),

    getRelatorioCiclo: (id: string) => api.get(`/caderno/relatorios/ciclo/${id}/`),
};