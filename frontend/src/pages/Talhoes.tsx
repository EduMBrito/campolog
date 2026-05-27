import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { agronomiaService } from '../services/agronomiaService';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { usePermissoes } from '../hooks/usePermissoes';
import styles from './Talhoes.module.css';

export default function Talhoes() {
    const { unidadeAtiva } = useContext(AuthContext); // eslint-disable-line
    const { podeEditar, podeExcluir, somenteLeitura } = usePermissoes();

    const [talhoes, setTalhoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // --- ESTADOS PARA ORDENAÇÃO NATIVOS ---
    type OrdenacaoCampos = 'nome' | 'area_m2' | null;
    const [ordenacao, setOrdenacao] = useState<OrdenacaoCampos>(null);
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');

    // Estados do Formulário originais do seu projeto
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [area, setArea] = useState('');
    const [coordenadas, setCoordenadas] = useState('');

    const nomeInputRef = useRef<HTMLInputElement>(null);

    // ➡️ Multi-tenant: Sempre que trocar de Campus na barra, recarrega a tabela de forma isolada
    useEffect(() => {
        carregarTalhoes();
    }, [unidadeAtiva]);

    const carregarTalhoes = async () => {
        try {
            setLoading(true);
            const response = await agronomiaService.getTalhoes();
            setTalhoes(response.data);
        } catch (error) {
            console.error("Erro ao carregar talhões:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Montamos o payload respeitando o campo do banco de dados do Django (area_m2)
            const dadosTalhao = {
                nome,
                area_m2: Number(area),
                coordenadas: coordenadas || undefined
            };

            if (idEdit !== null) {
                // Rota de Edição Multi-tenant automatizada
                await api.patch(`/agronomia/talhoes/${idEdit}/`, dadosTalhao);
                alert('Talhão atualizado com sucesso!');
            } else {
                // Rota de Inserção Multi-tenant (O Interceptor anexa o ID da fazenda ativa)
                await api.post('/agronomia/talhoes/', dadosTalhao);
                alert('Novo talhão cadastrado e registrado nesta Unidade!');
            }

            limparFormulario();
            carregarTalhoes();
        } catch (error: any) {
            console.error('Erro ao salvar talhão:', error.response?.data || error.message);
            alert('Erro ao salvar talhão. Verifique as informações inseridas ou se o servidor está online.');
        }
    };

    const handleEditar = (talhao: any) => {
        setIdEdit(talhao.id);
        setNome(talhao.nome);
        setArea(String(talhao.area_m2));
        setCoordenadas(talhao.coordenadas || '');
        
        if (nomeInputRef.current) {
            nomeInputRef.current.focus();
        }
    };

    const handleExcluir = async (id: number, nomeTalhao: string) => {
        if (window.confirm(`Tem certeza que deseja excluir o talhão "${nomeTalhao}"?`)) {
            try {
                await api.delete(`/agronomia/talhoes/${id}/`);
                alert('Talhão removido com sucesso.');
                carregarTalhoes();
            } catch (error) {
                console.error('Erro ao excluir talhão:', error);
                alert('Não foi possível remover o talhão.');
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setNome('');
        setArea('');
        setCoordenadas('');
    };

    // --- SUA LÓGICA DE FILTRAGEM E ORDENAÇÃO MANUTIDA ---
    const talhoesFiltrados = talhoes
        .filter(t => t.nome.toLowerCase().includes(termoPesquisa.toLowerCase()))
        .sort((a, b) => {
            if (!ordenacao) return 0;
            const campo = ordenacao === 'area_m2' ? 'area_m2' : 'nome';
            const valA = a[campo];
            const valB = b[campo];

            if (typeof valA === 'string') {
                return direcaoOrdenacao === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            } else {
                return direcaoOrdenacao === 'asc' ? valA - valB : valB - valA;
            }
        });

    return (
        <div className={styles.container || ''} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className={styles.title || ''} style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold' }}>Gestão de Talhões e Parcelas</h1>
                <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>&larr; Voltar ao Painel</Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: somenteLeitura ? '1fr' : '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>

                {!somenteLeitura && (
                <form onSubmit={handleSalvar} className={styles.formCard || ''} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '4px solid #2D5A27' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#1E293B' }}>
                        {idEdit !== null ? '✏️ Editar Área' : '➕ Nova Área de Cultivo'}
                    </h2>
                    
                    <div className={styles.inputGroup || ''} style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Nome do Talhão / Setor</label>
                        <input 
                            ref={nomeInputRef}
                            type="text" 
                            value={nome} 
                            onChange={(e) => setNome(e.target.value)} 
                            placeholder="Ex: Setor A - Parcela 04, Estufa 02..." 
                            required 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                        />
                    </div>

                    <div className={styles.inputGroup || ''} style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Área em Metros Quadrados (m²)</label>
                        <input 
                            type="number" 
                            value={area} 
                            onChange={(e) => setArea(e.target.value)} 
                            placeholder="Ex: 250" 
                            required 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                        />
                    </div>

                    <div className={styles.inputGroup || ''} style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Coordenadas GPS / Polígono (Opcional)</label>
                        <input 
                            type="text" 
                            value={coordenadas} 
                            onChange={(e) => setCoordenadas(e.target.value)} 
                            placeholder="Ex: -9.3812, -40.5032" 
                            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" className={styles.btnPrimary || ''} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {idEdit !== null ? 'Atualizar' : 'Salvar'}
                        </button>
                        {idEdit !== null && (
                            <button type="button" onClick={limparFormulario} className={styles.btnSecondary || ''} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#64748B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
                )}

                {/* 📊 Tabela de Listagem Filtrada */}
                <div className={styles.tableCard || ''} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#1E293B' }}>Áreas da Unidade Produtiva Atual</h2>
                        <input 
                            type="text"
                            placeholder="🔍 Filtrar área..."
                            value={termoPesquisa}
                            onChange={(e) => setTermoPesquisa(e.target.value)}
                            style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                        />
                    </div>

                    {loading ? <p style={{ color: '#64748B' }}>A carregar mapas de campo...</p> : talhoesFiltrados.length === 0 ? (
                        <p className={styles.emptyText || ''} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum talhão cadastrado para esta unidade produtiva.</p>
                    ) : (
                        <div className={styles.tableResponsive || ''}>
                            <table className={styles.table || ''} style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#1E293B' }}>
                                        <th onClick={() => { setOrdenacao('nome'); setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', padding: '0.75rem' }}>
                                            Nome / Lote {ordenacao === 'nome' && (direcaoOrdenacao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        <th onClick={() => { setOrdenacao('area_m2'); setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer', padding: '0.75rem' }}>
                                            Tamanho {ordenacao === 'area_m2' && (direcaoOrdenacao === 'asc' ? '▲' : '▼')}
                                        </th>
                                        {(podeEditar || podeExcluir) && <th style={{ padding: '0.75rem' }}>Ações</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {talhoesFiltrados.map((t) => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{t.nome}</span>
                                                {t.coordenadas && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>📍 {t.coordenadas}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#475569' }}>{t.area_m2} m²</td>
                                            {(podeEditar || podeExcluir) && (
                                            <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                                {podeEditar && (
                                                <button type="button" onClick={() => handleEditar(t)}
                                                    style={{ padding: '0.3rem 0.6rem', backgroundColor: '#1E293B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    Editar
                                                </button>
                                                )}
                                                {podeExcluir && (
                                                <button type="button" onClick={() => handleExcluir(t.id, t.nome)}
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