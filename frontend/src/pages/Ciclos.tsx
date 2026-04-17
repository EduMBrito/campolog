import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { agronomiaService } from '../services/agronomiaService';
import styles from './Ciclos.module.css';

export default function Ciclos() {
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [culturas, setCulturas] = useState<any[]>([]);
    const [talhoes, setTalhoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // --- NOVOS ESTADOS PARA ORDENAÇÃO ---
    type OrdenacaoCampos = 'cultura_nome' | 'data_inicio' | 'data_fim_prevista' | 'status' | null;
    const [ordenacao, setOrdenacao] = useState<OrdenacaoCampos>(null);
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');

    // Estados do Formulário
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [talhaoId, setTalhaoId] = useState('');
    const [culturaId, setCulturaId] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFimPrevista, setDataFimPrevista] = useState('');
    const [status, setStatus] = useState('PLANEJADO');

    const talhaoInputRef = useRef<HTMLSelectElement>(null);

    const carregarDados = async () => {
        try {
            const [resCiclos, resCulturas, resTalhoes] = await Promise.all([
                agronomiaService.getCiclos(),
                agronomiaService.getCulturas(),
                agronomiaService.getTalhoes()
            ]);
            setCiclos(resCiclos.data);
            setCulturas(resCulturas.data);
            setTalhoes(resTalhoes.data);
        } catch (error) {
            console.error("Erro ao carregar dados do ciclo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        const dados = {
            talhao: parseInt(talhaoId),
            cultura: parseInt(culturaId),
            data_inicio: dataInicio,
            data_fim_prevista: dataFimPrevista,
            status
        };

        try {
            if (idEdit) {
                await agronomiaService.updateCiclo(idEdit, dados);
            } else {
                await agronomiaService.createCiclo(dados);
            }
            limparFormulario();
            carregarDados();
        } catch (error) {
            alert("Erro ao salvar ciclo. Verifique as datas e os campos obrigatórios.");
        }
    };

    const handleEditar = (ciclo: any) => {
        setIdEdit(ciclo.id);
        setTalhaoId(ciclo.talhao.toString());
        setCulturaId(ciclo.cultura.toString());
        setDataInicio(ciclo.data_inicio);
        setDataFimPrevista(ciclo.data_fim_prevista);
        setStatus(ciclo.status);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number) => {
        if (window.confirm(`Tem certeza que deseja excluir este ciclo? Registros vinculados serão perdidos.`)) {
            try {
                await agronomiaService.deleteCiclo(id);
                carregarDados();
            } catch (error) {
                alert("Erro ao excluir o ciclo de cultivo.");
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setTalhaoId('');
        setCulturaId('');
        setDataInicio('');
        setDataFimPrevista('');
        setStatus('PLANEJADO');
        talhaoInputRef.current?.focus();
    };

    // --- FUNÇÃO PARA TROCAR A ORDENAÇÃO AO CLICAR NO CABEÇALHO ---
    const handleSort = (campo: OrdenacaoCampos) => {
        if (ordenacao === campo) {
            // Se clicar no mesmo campo, inverte a direção
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
        } else {
            // Se clicar num campo novo, ordena por ele de forma crescente
            setOrdenacao(campo);
            setDirecaoOrdenacao('asc');
        }
    };

    // --- APLICANDO FILTRO E DEPOIS ORDENAÇÃO ---
    let ciclosFiltrados = ciclos.filter(c => {
        const termo = termoPesquisa.toLowerCase();
        return (
            (c.talhao_nome?.toLowerCase().includes(termo)) ||
            (c.cultura_nome?.toLowerCase().includes(termo)) ||
            (c.status.toLowerCase().includes(termo))
        );
    });

    if (ordenacao) {
        ciclosFiltrados.sort((a, b) => {
            const valorA = a[ordenacao];
            const valorB = b[ordenacao];
            
            // Para strings (Cultura, Status) usamos localeCompare para ordem alfabética
            // Para datas (no formato YYYY-MM-DD), a simples comparação alfabética/de string funciona perfeitamente
            if (valorA < valorB) {
                return direcaoOrdenacao === 'asc' ? -1 : 1;
            }
            if (valorA > valorB) {
                return direcaoOrdenacao === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Auxiliar para mostrar a setinha no cabeçalho da tabela
    const renderSortIcon = (campo: OrdenacaoCampos) => {
        if (ordenacao !== campo) return null;
        return <span className={styles.sortIcon}>{direcaoOrdenacao === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginBottom: '1rem' }}>
                    &larr; Voltar para o Painel
                </Link>
                <h1 className={styles.title}>Ciclos de Cultivo</h1>
                <p style={{ color: '#64748B', marginTop: 0 }}>Gerencie os plantios em andamento nas áreas do instituto.</p>
            </div>

            <div className={styles.grid}>
                {/* Lado Esquerdo: Formulário */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>{idEdit ? 'Editar Ciclo' : 'Novo Ciclo'}</h2>
                    <form onSubmit={handleSalvar}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Unidade Produtiva (Talhão) *</label>
                            <select ref={talhaoInputRef} className={styles.select} value={talhaoId} onChange={e => setTalhaoId(e.target.value)} required>
                                <option value="">Selecione uma área...</option>
                                {talhoes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cultura *</label>
                            <select className={styles.select} value={culturaId} onChange={e => setCulturaId(e.target.value)} required>
                                <option value="">Selecione a cultura...</option>
                                {culturas.map(c => <option key={c.id} value={c.id}>{c.nome} {c.variedade && `(${c.variedade})`}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Data de Plantio *</label>
                                <input type="date" className={styles.input} value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Previsão de Colheita *</label>
                                <input type="date" className={styles.input} value={dataFimPrevista} onChange={e => setDataFimPrevista(e.target.value)} required />
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Status do Ciclo</label>
                            <select className={styles.select} value={status} onChange={e => setStatus(e.target.value)}>
                                <option value="PLANEJADO">Planejado</option>
                                <option value="ATIVO">Ativo / Em andamento</option>
                                <option value="COLHIDO">Colhido / Finalizado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                        
                        <button type="submit" className={styles.button}>
                            {idEdit ? 'Salvar Alterações' : 'Iniciar Ciclo'}
                        </button>
                        {idEdit && <button type="button" onClick={limparFormulario} className={styles.button} style={{ backgroundColor: '#64748B', marginTop: '0.5rem' }}>Cancelar</button>}
                    </form>
                </div>

                {/* Lado Direito: Tabela */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Histórico de Ciclos</h2>
                    <div className={styles.searchContainer}>
                        <input type="text" placeholder="🔍 Pesquisar por talhão, cultura ou status..." value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)} className={styles.searchInput} />
                    </div>

                    {loading ? <p>Carregando ciclos...</p> : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {/* CABEÇALHOS CLICÁVEIS */}
                                        <th className={styles.sortableHeader} onClick={() => handleSort('cultura_nome')}>
                                            Plantio {renderSortIcon('cultura_nome')}
                                        </th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('data_inicio')}>
                                            Data Plantio {renderSortIcon('data_inicio')}
                                        </th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('data_fim_prevista')}>
                                            Prev. Colheita {renderSortIcon('data_fim_prevista')}
                                        </th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('status')}>
                                            Status {renderSortIcon('status')}
                                        </th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ciclosFiltrados.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum ciclo encontrado.</td></tr>
                                    ) : (
                                        ciclosFiltrados.map(c => (
                                            <tr key={c.id}>
                                                <td>
                                                    <strong>{c.cultura_nome}</strong>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>📍 {c.talhao_nome}</div>
                                                </td>
                                                <td>{new Date(c.data_inicio).toLocaleDateString('pt-BR')}</td>
                                                <td>{new Date(c.data_fim_prevista).toLocaleDateString('pt-BR')}</td>
                                                <td>
                                                    <span className={`${styles.badge} ${styles['status_' + c.status.toLowerCase()]}`}>
                                                        {c.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => handleEditar(c)} className={`${styles.actionButton} ${styles.editBtn}`}>Editar</button>
                                                    <button type="button" onClick={() => handleExcluir(c.id)} className={`${styles.actionButton} ${styles.deleteBtn}`}>Excluir</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}