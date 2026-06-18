import api from './api';

export interface LogAuditoria {
  id: number;
  usuario: number | null;
  usuario_nome: string;
  acao: 'CRIAR' | 'ATUALIZAR' | 'EXCLUIR';
  acao_display: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: Record<string, any> | null;
  dados_novos: Record<string, any> | null;
  unidade: number | null;
  unidade_nome: string | null;
  timestamp: string;
}

export interface FiltrosAuditoria {
  search?: string;
  acao?: string;
  entidade?: string;
  ordering?: string;
}

export const auditoriaService = {
  // GET: lista os logs de auditoria (Auditor vê a unidade ativa; Admin vê tudo)
  getLogs: (filtros: FiltrosAuditoria = {}) => {
    const params: Record<string, string> = {};
    if (filtros.search) params.search = filtros.search;
    if (filtros.acao) params.acao = filtros.acao;
    if (filtros.entidade) params.entidade = filtros.entidade;
    params.ordering = filtros.ordering || '-timestamp';
    return api.get<LogAuditoria[]>('/auditoria/logs/', { params });
  },
};
