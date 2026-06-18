import { useState, useEffect, useContext, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { auditoriaService, type LogAuditoria, type FiltrosAuditoria } from '../services/auditoriaService';
import styles from './Auditoria.module.css';

// Nomes amigáveis para os models registados no log
const ENTIDADES: Record<string, string> = {
    RegistoCampo: 'Diário de Campo',
    Talhao: 'Talhão',
    CicloCultivo: 'Ciclo de Cultivo',
    Cultura: 'Cultura',
    UnidadeProdutiva: 'Unidade Produtiva',
};

const badgeClasse: Record<string, string> = {
    CRIAR: styles.badgeCriar,
    ATUALIZAR: styles.badgeAtualizar,
    EXCLUIR: styles.badgeExcluir,
};

function formatarData(iso: string): string {
    try {
        return new Date(iso).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

function formatarValor(v: any): string {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

interface LinhaDiff {
    campo: string;
    antes: any;
    depois: any;
}

// Compara os snapshots e devolve apenas o que mudou (ou tudo, no caso de criar/excluir)
function calcularDiff(log: LogAuditoria): LinhaDiff[] {
    const antes = log.dados_anteriores || {};
    const depois = log.dados_novos || {};
    const chaves = new Set([...Object.keys(antes), ...Object.keys(depois)]);
    const linhas: LinhaDiff[] = [];

    chaves.forEach((campo) => {
        const a = antes[campo];
        const d = depois[campo];
        if (log.acao === 'ATUALIZAR' && JSON.stringify(a) === JSON.stringify(d)) return;
        linhas.push({ campo, antes: a, depois: d });
    });

    return linhas.sort((x, y) => x.campo.localeCompare(y.campo));
}

export default function Auditoria() {
    const { unidadeAtiva } = useContext(AuthContext);

    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState<number | null>(null);

    const [busca, setBusca] = useState('');
    const [acao, setAcao] = useState('');
    const [entidade, setEntidade] = useState('');

    const carregar = useCallback(async () => {
        try {
            setLoading(true);
            const filtros: FiltrosAuditoria = {};
            if (busca.trim()) filtros.search = busca.trim();
            if (acao) filtros.acao = acao;
            if (entidade) filtros.entidade = entidade;

            const resp = await auditoriaService.getLogs(filtros);
            // Endpoint sem paginação devolve array direto; tolera formato paginado por segurança
            const data: any = resp.data;
            setLogs(Array.isArray(data) ? data : data?.results ?? []);
        } catch (error) {
            console.error('Erro ao carregar logs de auditoria:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [busca, acao, entidade]);

    // Recarrega ao trocar de unidade ou ajustar ação/entidade; a busca usa debounce
    useEffect(() => {
        const t = setTimeout(carregar, 350);
        return () => clearTimeout(t);
    }, [carregar, unidadeAtiva]);

    const toggle = (id: number) => setExpandido((atual) => (atual === id ? null : id));

    return (
        <div className={styles.container}>
            <div className={styles.topo}>
                <Link to="/" className={styles.voltar}>&larr; Voltar ao Painel</Link>
            </div>

            <h1 className={styles.titulo}>🛡️ Trilha de Auditoria</h1>
            <p className={styles.subtitulo}>
                Histórico imutável de criações, edições e exclusões. Clique numa linha para ver o detalhe das alterações.
            </p>

            <div className={styles.filtros}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="🔎 Buscar por entidade, usuário ou ID..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
                <select className={styles.select} value={acao} onChange={(e) => setAcao(e.target.value)}>
                    <option value="">Todas as ações</option>
                    <option value="CRIAR">Criação</option>
                    <option value="ATUALIZAR">Atualização</option>
                    <option value="EXCLUIR">Exclusão</option>
                </select>
                <select className={styles.select} value={entidade} onChange={(e) => setEntidade(e.target.value)}>
                    <option value="">Todas as entidades</option>
                    {Object.entries(ENTIDADES).map(([valor, rotulo]) => (
                        <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className={styles.carregando}>🔄 Carregando trilha de auditoria...</div>
            ) : logs.length === 0 ? (
                <div className={styles.tabelaWrap}>
                    <div className={styles.vazio}>Nenhum registro de auditoria encontrado para os filtros aplicados.</div>
                </div>
            ) : (
                <div className={styles.tabelaWrap}>
                    <table className={styles.tabela}>
                        <thead>
                            <tr>
                                <th>Data / Hora</th>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Entidade</th>
                                <th>Unidade</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => {
                                const diff = calcularDiff(log);
                                const aberto = expandido === log.id;
                                return (
                                    <Fragment key={log.id}>
                                        <tr className={styles.linha} onClick={() => toggle(log.id)}>
                                            <td>{formatarData(log.timestamp)}</td>
                                            <td>{log.usuario_nome || '—'}</td>
                                            <td>
                                                <span className={`${styles.badge} ${badgeClasse[log.acao] || ''}`}>
                                                    {log.acao_display}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={styles.entidadeTag}>
                                                    {ENTIDADES[log.entidade] || log.entidade}
                                                </span>{' '}
                                                {log.entidade_id && (
                                                    <span className={styles.entidadeId}>#{log.entidade_id}</span>
                                                )}
                                            </td>
                                            <td>{log.unidade_nome || '—'}</td>
                                            <td className={styles.expandIcon}>{aberto ? '▲' : '▼'}</td>
                                        </tr>
                                        {aberto && (
                                            <tr className={styles.detalhe}>
                                                <td colSpan={6}>
                                                    <div className={styles.detalheConteudo}>
                                                        {diff.length === 0 ? (
                                                            <em>Sem dados detalhados para esta operação.</em>
                                                        ) : (
                                                            <table className={styles.diffTabela}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Campo</th>
                                                                        {log.acao !== 'CRIAR' && <th>Antes</th>}
                                                                        {log.acao !== 'EXCLUIR' && <th>Depois</th>}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {diff.map((linha) => (
                                                                        <tr key={linha.campo}>
                                                                            <td className={styles.diffCampo}>{linha.campo}</td>
                                                                            {log.acao !== 'CRIAR' && (
                                                                                <td className={log.acao === 'EXCLUIR' ? styles.valNeutro : styles.valAntes}>
                                                                                    {formatarValor(linha.antes)}
                                                                                </td>
                                                                            )}
                                                                            {log.acao !== 'EXCLUIR' && (
                                                                                <td className={log.acao === 'CRIAR' ? styles.valNeutro : styles.valDepois}>
                                                                                    {formatarValor(linha.depois)}
                                                                                </td>
                                                                            )}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
