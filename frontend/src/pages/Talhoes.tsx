import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { agronomiaService } from '../services/agronomiaService';
import styles from './Talhoes.module.css';

export default function Talhoes() {
    const [talhoes, setTalhoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // --- ESTADOS PARA ORDENAÇÃO ---
    type OrdenacaoCampos = 'nome' | 'area_m2' | null;
    const [ordenacao, setOrdenacao] = useState<OrdenacaoCampos>(null);
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');

    // Estados do Formulário
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [area, setArea] = useState('');
    const [coordenadas, setCoordenadas] = useState('');

    const nomeInputRef = useRef<HTMLInputElement>(null);

    const carregarTalhoes = async () => {
        try {
            const response = await agronomiaService.getTalhoes();
            setTalhoes(response.data);
        } catch (error) {
            console.error("Erro ao carregar talhões:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarTalhoes(); }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        const areaFormatada = area.replace(',', '.');

        const dados = {
            nome,
            area_m2: parseFloat(areaFormatada),
            coordenadas
        };

        try {
            if (idEdit) {
                await agronomiaService.updateTalhao(idEdit, dados);
            } else {
                await agronomiaService.createTalhao(dados);
            }
            limparFormulario();
            carregarTalhoes();
        } catch (error) {
            alert("Erro ao salvar talhão. Verifique os dados.");
        }
    };

    const handleEditar = (talhao: any) => {
        setIdEdit(talhao.id);
        setNome(talhao.nome);
        setArea(talhao.area_m2.toString());
        setCoordenadas(talhao.coordenadas || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number, nomeTalhao: string) => {
        if (window.confirm(`Atenção! Deseja realmente excluir a área "${nomeTalhao}"?`)) {
            try {
                await agronomiaService.deleteTalhao(id);
                carregarTalhoes();
            } catch (error) {
                alert("Erro ao excluir. Este talhão pode ter ciclos vinculados.");
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setNome('');
        setArea('');
        setCoordenadas('');
        nomeInputRef.current?.focus();
    };

    // --- FUNÇÃO DE ORDENAÇÃO ---
    const handleSort = (campo: OrdenacaoCampos) => {
        if (ordenacao === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenacao(campo);
            setDirecaoOrdenacao('asc');
        }
    };

    // --- FILTRAGEM E ORDENAÇÃO ---
    let talhoesFiltrados = talhoes.filter(t => 
        t.nome.toLowerCase().includes(termoPesquisa.toLowerCase())
    );

    if (ordenacao) {
        talhoesFiltrados.sort((a, b) => {
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
                <h1 className={styles.title}>Unidades Produtivas (Talhões)</h1>
                <p style={{ color: '#64748B', marginTop: 0 }}>Gerencie as áreas físicas de cultivo do Instituto.</p>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>{idEdit ? 'Editar Talhão' : 'Novo Talhão'}</h2>
                    <form onSubmit={handleSalvar}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nome da Área / Identificador *</label>
                            <input ref={nomeInputRef} className={styles.input} value={nome} onChange={e => setNome(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Área em Metros Quadrados (m²) *</label>
                            <input type="number" step="0.01" className={styles.input} value={area} onChange={e => setArea(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Coordenadas GPS (Opcional)</label>
                            <input className={styles.input} value={coordenadas} onChange={e => setCoordenadas(e.target.value)} />
                        </div>
                        <button type="submit" className={styles.button}>
                            {idEdit ? 'Salvar Alterações' : 'Cadastrar Área'}
                        </button>
                        {idEdit && <button type="button" onClick={limparFormulario} className={styles.button} style={{ backgroundColor: '#64748B', marginTop: '0.5rem' }}>Cancelar</button>}
                    </form>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Áreas Cadastradas</h2>
                    <div className={styles.searchContainer}>
                        <input type="text" placeholder="🔍 Pesquisar por nome..." value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)} className={styles.searchInput} />
                    </div>

                    {loading ? <p>Carregando áreas...</p> : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('nome')}>
                                            Identificador {renderSortIcon('nome')}
                                        </th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('area_m2')}>
                                            Área (m²) {renderSortIcon('area_m2')}
                                        </th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {talhoesFiltrados.length === 0 ? (
                                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhuma área encontrada.</td></tr>
                                    ) : (
                                        talhoesFiltrados.map(t => (
                                            <tr key={t.id}>
                                                <td>
                                                    <strong>{t.nome}</strong>
                                                    {t.coordenadas && <div style={{ fontSize: '0.75rem', color: '#64748B' }}>📍 {t.coordenadas}</div>}
                                                </td>
                                                <td>{t.area_m2}</td>
                                                <td>
                                                    <button type="button" onClick={() => handleEditar(t)} className={`${styles.actionButton} ${styles.editBtn}`}>Editar</button>
                                                    <button type="button" onClick={() => handleExcluir(t.id, t.nome)} className={`${styles.actionButton} ${styles.deleteBtn}`}>Excluir</button>
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