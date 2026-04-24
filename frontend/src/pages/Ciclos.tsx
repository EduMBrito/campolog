import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code'; // Biblioteca do QR Code
import { agronomiaService } from '../services/agronomiaService';
import styles from './Ciclos.module.css';

export default function Ciclos() {
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [culturas, setCulturas] = useState<any[]>([]);
    const [talhoes, setTalhoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Estado para o QR Code
    const [cicloImprimir, setCicloImprimir] = useState<any>(null);

    // Estados de Ordenação
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

    const handleSort = (campo: OrdenacaoCampos) => {
        if (ordenacao === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenacao(campo);
            setDirecaoOrdenacao('asc');
        }
    };

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
            if (valorA < valorB) return direcaoOrdenacao === 'asc' ? -1 : 1;
            if (valorA > valorB) return direcaoOrdenacao === 'asc' ? 1 : -1;
            return 0;
        });
    }

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
                                        <th className={styles.sortableHeader} onClick={() => handleSort('cultura_nome')}>Plantio {renderSortIcon('cultura_nome')}</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('data_inicio')}>Data Plantio {renderSortIcon('data_inicio')}</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('data_fim_prevista')}>Prev. Colheita {renderSortIcon('data_fim_prevista')}</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('status')}>Status {renderSortIcon('status')}</th>
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
                                                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <button type="button" onClick={() => handleEditar(c)} className={`${styles.actionButton} ${styles.editBtn}`}>Editar</button>
                                                    <button type="button" onClick={() => handleExcluir(c.id)} className={`${styles.actionButton} ${styles.deleteBtn}`}>Excluir</button>
    
                                                    {/* Botão Histórico - Estilizado para parecer um botão idêntico ao da Placa */}
                                                    <Link 
                                                        to={`/rastreabilidade/${c.id}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={styles.actionButton} 
                                                        style={{ 
                                                            textDecoration: 'none', 
                                                            color: '#2D5A27', 
                                                            backgroundColor: '#F8FAFC', 
                                                            border: '1px solid #E2E8F0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            fontWeight: '600',
                                                            fontSize: '0.75rem' // Garante que o texto tenha o mesmo tamanho
                                                        }}
                                                    >
                                                        📜 Histórico
                                                    </Link>

                                                    {/* Botão Placa - Agora com fundo e borda para casar com o Histórico */}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setCicloImprimir(c)} 
                                                        className={styles.actionButton} 
                                                        style={{
                                                            color: '#9a3412', 
                                                            backgroundColor: '#FEF3C7', // Um fundo amarelinho leve
                                                            border: '1px solid #FDE68A',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            fontWeight: '600',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        📱 Placa
                                                    </button>
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

            {/* --- MODAL E PLACA DE IMPRESSÃO --- */}
            {cicloImprimir && (
                <>
                    {/* Modal na tela do PC para o usuário confirmar */}
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <h2 style={{marginTop: 0, color: '#1E293B'}}>Gerar Placa do Lote</h2>
                            <p style={{color: '#64748B'}}>
                                Você está gerando a placa de <strong>{cicloImprimir.cultura_nome}</strong> cultivado na área <strong>{cicloImprimir.talhao_nome}</strong>.
                            </p>
                            
                            <div style={{margin: '2rem 0', display: 'flex', justifyContent: 'center'}}>
                                <QRCode value={`${window.location.origin}/rastreabilidade/${cicloImprimir.id}`} size={150} />
                            </div>
                            
                            <div style={{display: 'flex', gap: '1rem'}}>
                                <button onClick={() => window.print()} className={styles.button}>
                                    🖨️ Imprimir em A4
                                </button>
                                <button onClick={() => setCicloImprimir(null)} className={styles.button} style={{backgroundColor: '#64748B'}}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* A Placa em si (invisível na tela, visível apenas na folha de papel) */}
                    <div className={styles.placaPrint}>
                        <div className={styles.placaPrintInner}>
                            <h1 style={{fontSize: '2.5rem', color: '#2D5A27', margin: '0 0 0.5rem 0'}}>IFSertaoPE - Campus Petrolina Zona Rural</h1>
                            <h2 style={{fontSize: '1.5rem', margin: '0 0 2rem 0', color: '#1E293B'}}>Sistema de Rastreabilidade CampoLog</h2>

                            <div style={{borderBottom: '4px solid #E2E8F0', width: '80%', margin: '0 auto 3rem auto'}}></div>

                            <h1 style={{fontSize: '5rem', margin: '0 0 1rem 0', color: '#1E293B'}}>{cicloImprimir.cultura_nome}</h1>
                            <h2 style={{fontSize: '2.5rem', color: '#64748B', margin: '0 0 4rem 0'}}>Lote: {cicloImprimir.talhao_nome}</h2>

                            {/* O QR Code Gigante para a placa */}
                            <QRCode value={`${window.location.origin}/rastreabilidade/${cicloImprimir.id}`} size={400} />

                            <p style={{fontSize: '1.5rem', color: '#475569', marginTop: '4rem', fontWeight: 'bold'}}>
                                Escaneie com a câmera do celular para ver o histórico<br/>
                                completo de plantio, insumos e colheitas.
                            </p>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}