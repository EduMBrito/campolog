import api from './api';

export interface TalhaoData {
  id?: number;
  nome: string;
  area_m2: number;
  coordenadas?: string; // Opcional (Polígono ou GPS se houver)
}

export const agronomiaService = {
    
    //Talhões já na estrutura multi-tenant
    // GET: Traz apenas os talhões do Campus selecionado
    getTalhoes: () => api.get<TalhaoData[]>('/agronomia/talhoes/'), 
  
    // POST: Cria um talhão amarrado dinamicamente ao Campus atual
    createTalhao: (dados: TalhaoData) => api.post('/agronomia/talhoes/', dados),
  
    // PATCH/PUT: Edita dados de um talhão específico
    updateTalhao: (id: number, dados: TalhaoData) => api.patch(`/agronomia/talhoes/${id}/`, dados),
  
    // DELETE: Remove um talhão
    deleteTalhao: (id: number) => api.delete(`/agronomia/talhoes/${id}/`),
    
    // Culturas
    getCulturas: () => api.get('/agronomia/culturas/'),
    createCultura: (data: { nome: string, variedade?: string }) => api.post('/agronomia/culturas/', data),
    updateCultura: (id: number, data: { nome: string, variedade?: string }) => api.put(`/agronomia/culturas/${id}/`, data),
    deleteCultura: (id: number) => api.delete(`/agronomia/culturas/${id}/`),

    // Ciclos (Já deixaremos as chamadas prontas para a última tela do M2)
    getCiclos: () => api.get('/agronomia/ciclos/'),
    createCiclo: (data: any) => api.post('/agronomia/ciclos/', data),
    updateCiclo: (id: number, data: any) => api.put(`/agronomia/ciclos/${id}/`, data),
    deleteCiclo: (id: number) => api.delete(`/agronomia/ciclos/${id}/`),
    getEstatisticas: () => api.get('/agronomia/estatisticas/'),
};