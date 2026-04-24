import api from './api';

export const agronomiaService = {
    // Culturas
    getCulturas: () => api.get('/agronomia/culturas/'),
    createCultura: (data: { nome: string, variedade?: string }) => api.post('/agronomia/culturas/', data),
    updateCultura: (id: number, data: { nome: string, variedade?: string }) => api.put(`/agronomia/culturas/${id}/`, data),
    deleteCultura: (id: number) => api.delete(`/agronomia/culturas/${id}/`),

    // Talhões (Já deixaremos as chamadas prontas para a próxima tela)
    getTalhoes: () => api.get('/agronomia/talhoes/'),
    createTalhao: (data: any) => api.post('/agronomia/talhoes/', data),
    updateTalhao: (id: number, data: any) => api.put(`/agronomia/talhoes/${id}/`, data),
    deleteTalhao: (id: number) => api.delete(`/agronomia/talhoes/${id}/`),
    
    // Ciclos (Já deixaremos as chamadas prontas para a última tela do M2)
    getCiclos: () => api.get('/agronomia/ciclos/'),
    createCiclo: (data: any) => api.post('/agronomia/ciclos/', data),
    updateCiclo: (id: number, data: any) => api.put(`/agronomia/ciclos/${id}/`, data),
    deleteCiclo: (id: number) => api.delete(`/agronomia/ciclos/${id}/`),
    getEstatisticas: () => api.get('/agronomia/estatisticas/'),
};