import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { usePermissoes } from '../hooks/usePermissoes';
import styles from './Culturas.module.css';

export default function Culturas() {
    const { unidadeAtiva: _ } = useContext(AuthContext); // keep for future use
    const { podeEditar, podeExcluir, somenteLeitura } = usePermissoes();

    const [culturas, setCulturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // --- ESTADOS PARA ORDENAÇÃO ---
    type OrdenacaoCampos = 'nome' | 'variedade' | null;
    const [ordenacao, setOrdenacao] = useState<OrdenacaoCampos>(null);
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');

    // Estados do Formulário (Alinhados com o models.py do Django)
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [variedade, setVariedade] = useState('');

    const nomeInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        carregarCulturas();
    }, []);

    const carregarCulturas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/agronomia/culturas/');
            setCulturas(response.data);
        } catch (error) {
            console.error("Erro ao carregar catálogo de culturas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dadosCultura = {
                nome: nome.trim(),
                variedade: variedade.trim() || null
            };

            if (idEdit !== null) {
                // Modo Edição
                await api.patch(`/agronomia/culturas/${idEdit}/`, dadosCultura);
                alert('Cultura atualizada no catálogo global!');
            } else {
                // Modo Cadastro Novo
                await api.post('/agronomia/culturas/', dadosCultura);
                alert('Nova cultura adicionada ao catálogo global!');
            }

            limparFormulario();
            carregarCulturas();
        } catch (error: any) {
            console.error('Erro ao salvar cultura:', error.response?.data || error.message);
            alert('Erro ao salvar. Verifique se os dados estão corretos.');
        }
    };

    const handleEditar = (cultura: any) => {
        setIdEdit(cultura.id);
        setNome(cultura.nome);
        setVariedade(cultura.variedade || '');
        
        if (nomeInputRef.current) {
            nomeInputRef.current.focus();
        }
    };

    const handleExcluir = async (id: number, nomeCultura: string) => {
        if (window.confirm(`Tem certeza que deseja remover "${nomeCultura}" do catálogo? Isso pode indisponibilizá-la para novos ciclos.`)) {
            try {
                await api.delete(`/agronomia/culturas/${id}/`);
                alert('Cultura removida com sucesso.');
                carregarCulturas();
            } catch (error) {
                console.error('Erro ao excluir cultura:', error);
                alert('Não foi possível remover. Verifique se ela está vinculada a algum ciclo ativo.');
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setNome('');
        setVariedade('');
    };

    // --- FILTRAGEM E ORDENAÇÃO NATIVA ---
    const culturasFiltradas = culturas
        .filter(c => 
            c.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
            (c.variedade && c.variedade.toLowerCase().includes(termoPesquisa.toLowerCase()))
        )
        .sort((a, b) => {
            if (!ordenacao) return 0;
            const campo = ordenacao === 'variedade' ? 'variedade' : 'nome';
            const valA = a[campo] || '';
            const valB = b[campo] || '';

            return direcaoOrdenacao === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
        });

    return (
        <div className={styles.container} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.title} style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold' }}>Catálogo Global de Culturas</h1>
                <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>&larr; Voltar ao Painel</Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: somenteLeitura ? '1fr' : '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>

                {!somenteLeitura && (
                <form onSubmit={handleSalvar} className={styles.formCard} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '4px solid #2D5A27' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1E293B' }}>
                        {idEdit !== null ? '✏️ Editar Registro' : '➕ Adicionar ao Catálogo'}
                    </h2>
                    
                    <div className={styles.inputGroup} style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Nome da Cultura</label>
                        <input 
                            ref={nomeInputRef}
                            type="text" 
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)} 
                            placeholder="Ex: Coentro, Alface, Manga, Melancia..." 
                            required 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                        />
                    </div>

                    <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Variedade / Nome Científico (Opcional)</label>
                        <input 
                            type="text" 
                            value={variedade} 
                            onChange={(e) => setVariedade(e.target.value)} 
                            placeholder="Ex: Verdão, Tommy Atkins, Crespa..." 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className={styles.btnPrimary} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {idEdit !== null ? 'Atualizar' : 'Adicionar'}
                        </button>
                        {idEdit !== null && (
                            <button type="button" onClick={limparFormulario} className={styles.btnSecondary} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#64748B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
                )}

                {/* 📊 Tabela Biblioteca do Instituto */}
                <div className={styles.tableCard} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#1E293B' }}>Biblioteca de Plantas</h2>
                        <input 
                            type="text"
                            placeholder="🔍 Buscar planta ou variedade..."
                            value={termoPesquisa}
                            onChange={(e) => setTermoPesquisa(e.target.value)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                        />
                    </div>

                    {loading ? <p style={{ color: '#64748B' }}>A carregar catálogo de espécies...</p> : culturasFiltradas.length === 0 ? (
                        <p className={styles.emptyText} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhuma cultura cadastrada no sistema ainda.</p>
                    ) : (
                        <div className={styles.tableResponsive}>
                            <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#1E293B' }}>
                                        <th onClick={() => { setOrdenacao('nome'); setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', padding: '0.75rem' }}>
                                            Espécie / Cultura {ordenacao === 'nome' && (direcaoOrdenacao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th onClick={() => { setOrdenacao('variedade'); setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', padding: '0.75rem' }}>
                                            Variedade {ordenacao === 'variedade' && (direcaoOrdenacao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        {(podeEditar || podeExcluir) && <th style={{ padding: '0.75rem' }}>Ações</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {culturasFiltradas.map((c) => (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{c.nome}</span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#475569' }}>
                                                {c.variedade ? <code style={{ background: '#F1F5F9', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>{c.variedade}</code> : <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Não especificada</span>}
                                            </td>
                                            {(podeEditar || podeExcluir) && (
                                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                {podeEditar && (
                                                <button type="button" onClick={() => handleEditar(c)}
                                                    style={{ padding: '0.3rem 0.6rem', backgroundColor: '#1E293B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    Editar
                                                </button>
                                                )}
                                                {podeExcluir && (
                                                <button type="button" onClick={() => handleExcluir(c.id, c.nome)}
                                                    style={{ padding: '0.3rem 0.6rem', backgroundColor: '#DC2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    Excluir
                                                </button>
                                                )}
                                            </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}