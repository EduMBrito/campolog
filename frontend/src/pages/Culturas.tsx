import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { agronomiaService } from '../services/agronomiaService';
import styles from './Culturas.module.css';


export default function Culturas() {
    const [culturas, setCulturas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Novo estado para a barra de pesquisa
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Estados do Formulário
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [variedade, setVariedade] = useState('');
    const nomeInputRef = useRef<HTMLInputElement>(null);

    const carregarCulturas = async () => {
        try {
            const response = await agronomiaService.getCulturas();
            setCulturas(response.data);
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarCulturas(); }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (idEdit) {
                await agronomiaService.updateCultura(idEdit, { nome, variedade });
            } else {
                await agronomiaService.createCultura({ nome, variedade });
            }
            limparFormulario();
            carregarCulturas();
        } catch (error) {
            alert("Erro ao salvar cultura. Verifique os dados.");
        }
    };

    const handleEditar = (cultura: any) => {
        setIdEdit(cultura.id);
        setNome(cultura.nome);
        setVariedade(cultura.variedade || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number, nomeCultura: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a cultura ${nomeCultura}?`)) {
            try {
                await agronomiaService.deleteCultura(id);
                carregarCulturas();
            } catch (error) {
                alert("Erro ao excluir. Esta cultura pode já estar vinculada a um ciclo.");
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setNome('');
        setVariedade('');
        nomeInputRef.current?.focus();
    };

    // A MÁGICA ACONTECE AQUI: Filtramos a lista baseados no que o usuário digitou
    const culturasFiltradas = culturas.filter(c => {
        const termo = termoPesquisa.toLowerCase();
        const nomeMatch = c.nome.toLowerCase().includes(termo);
        const variedadeMatch = c.variedade ? c.variedade.toLowerCase().includes(termo) : false;
        return nomeMatch || variedadeMatch;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginBottom: '1rem' }}>
                    &larr; Voltar para o Painel
                </Link>
                <h1 className={styles.title}>Catálogo de Culturas</h1>
                <p style={{ color: '#64748B', marginTop: 0 }}>Gerencie as espécies e variedades cultivadas no Instituto.</p>
            </div>

            <div className={styles.grid}>
                {/* Lado Esquerdo: Formulário */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>{idEdit ? 'Editar Cultura' : 'Nova Cultura'}</h2>
                    <form onSubmit={handleSalvar}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nome da Cultura *</label>
                            <input ref={nomeInputRef} className={styles.input} value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Coentro, Milho, Uva" required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Variedade (Opcional)</label>
                            <input className={styles.input} value={variedade} onChange={e => setVariedade(e.target.value)} />
                        </div>
                        
                        <button type="submit" className={styles.button}>
                            {idEdit ? 'Salvar Alterações' : 'Cadastrar Cultura'}
                        </button>
                        
                        {idEdit && (
                            <button type="button" onClick={limparFormulario} className={styles.button} style={{ backgroundColor: '#64748B', marginTop: '0.5rem' }}>
                                Cancelar Edição
                            </button>
                        )}
                    </form>
                </div>

                {/* Lado Direito: Tabela e Pesquisa */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Culturas Cadastradas</h2>
                    
                    {/* NOSSA NOVA BARRA DE PESQUISA */}
                    <div className={styles.searchContainer}>
                        <input 
                            type="text" 
                            placeholder="🔍 Pesquisar por nome ou variedade..." 
                            value={termoPesquisa}
                            onChange={(e) => setTermoPesquisa(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    {loading ? <p>Carregando catálogo...</p> : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Cultura</th>
                                        <th>Variedade</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Agora mapeamos a lista FILTRADA em vez da lista original */}
                                    {culturasFiltradas.length === 0 ? (
                                        <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhuma cultura encontrada.</td></tr>
                                    ) : (
                                        culturasFiltradas.map(c => (
                                            <tr key={c.id}>
                                                <td><strong>{c.nome}</strong></td>
                                                <td>{c.variedade || '-'}</td>
                                                <td>
                                                    <button type="button" onClick={() => handleEditar(c)} className={`${styles.actionButton} ${styles.editBtn}`}>Editar</button>
                                                    <button type="button" onClick={() => handleExcluir(c.id, c.nome)} className={`${styles.actionButton} ${styles.deleteBtn}`}>Excluir</button>
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