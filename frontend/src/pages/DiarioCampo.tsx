import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { cadernoService } from '../services/cadernoService';
import { agronomiaService } from '../services/agronomiaService';
import styles from './DiarioCampo.module.css';

export default function DiarioCampo() {
    const [registos, setRegistos] = useState<any[]>([]);
    const [ciclos, setCiclos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Estados de Ordenação
    type OrdenacaoCampos = 'data_registo' | 'tipo' | 'cultura_nome' | 'autor_nome' | null;
    const [ordenacao, setOrdenacao] = useState<OrdenacaoCampos>('data_registo');
    const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc'); 

    // Estados do Formulário
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [cicloId, setCicloId] = useState('');
    const [tipo, setTipo] = useState('OBSERVACAO');
    const [descricao, setDescricao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    
    // Novos Estados para o Upload de Arquivo
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const cicloInputRef = useRef<HTMLSelectElement>(null);
    const arquivoInputRef = useRef<HTMLInputElement>(null); // Referência para limpar o input de arquivo

    const carregarDados = async () => {
        try {
            const [resRegistos, resCiclos] = await Promise.all([
                cadernoService.getRegistos(),
                agronomiaService.getCiclos()
            ]);
            setRegistos(resRegistos.data);
            setCiclos(resCiclos.data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    // Função que captura a escolha do arquivo e gera a miniatura (Preview)
    const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setArquivo(file);
            setPreviewUrl(URL.createObjectURL(file)); // Gera uma URL local temporária para visualizar a foto
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Agora usamos FormData em vez de um objeto JSON simples
        const formData = new FormData();
        formData.append('ciclo', cicloId);
        formData.append('tipo', tipo);
        formData.append('descricao', descricao);
        if (quantidade) formData.append('quantidade', quantidade);
        
        // Só anexa o arquivo físico se o usuário tiver selecionado um novo
        if (arquivo) {
            formData.append('anexo', arquivo);
        }

        try {
            if (idEdit) {
                await cadernoService.updateRegisto(idEdit, formData);
            } else {
                await cadernoService.createRegisto(formData);
            }
            limparFormulario();
            carregarDados();
            alert("Registro salvo com sucesso!");
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar o registro. Verifique os campos e o tamanho do arquivo.");
        }
    };

    const handleEditar = (registo: any) => {
        setIdEdit(registo.id);
        setCicloId(registo.ciclo.toString());
        setTipo(registo.tipo);
        setDescricao(registo.descricao);
        setQuantidade(registo.quantidade || '');
        
        // Limpa o arquivo físico pendente, mas mostra a foto que já vem do banco de dados (se houver)
        setArquivo(null);
        setPreviewUrl(registo.anexo || null); 
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number) => {
        if (window.confirm(`Atenção! Deseja apagar definitivamente este registro?`)) {
            try {
                await cadernoService.deleteRegisto(id);
                carregarDados();
            } catch (error) {
                alert("Erro ao apagar o registro.");
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setCicloId('');
        setTipo('OBSERVACAO');
        setDescricao('');
        setQuantidade('');
        
        // Limpar estados do arquivo
        setArquivo(null);
        setPreviewUrl(null);
        if (arquivoInputRef.current) {
            arquivoInputRef.current.value = ''; // Reseta o texto "Nenhum arquivo selecionado"
        }
        
        cicloInputRef.current?.focus();
    };

    const handleSort = (campo: OrdenacaoCampos) => {
        if (ordenacao === campo) {
            setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenacao(campo);
            setDirecaoOrdenacao('asc');
        }
    };

    let registosFiltrados = registos.filter(r => {
        const termo = termoPesquisa.toLowerCase();
        return (
            (r.cultura_nome?.toLowerCase().includes(termo)) ||
            (r.descricao.toLowerCase().includes(termo)) ||
            (r.autor_nome?.toLowerCase().includes(termo)) ||
            (r.tipo_display?.toLowerCase().includes(termo))
        );
    });

    if (ordenacao) {
        registosFiltrados.sort((a, b) => {
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
                <h1 className={styles.title}>Diário de Campo</h1>
                <p style={{ color: '#64748B', marginTop: 0 }}>Registro diário de atividades, aplicações e colheitas com suporte a fotos.</p>
            </div>

            <div className={styles.grid}>
                {/* Formulário de Lançamento */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>{idEdit ? 'Editar Registro' : 'Novo Lançamento'}</h2>
                    <form onSubmit={handleSalvar}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Onde foi realizado? (Ciclo) *</label>
                            <select ref={cicloInputRef} className={styles.select} value={cicloId} onChange={e => setCicloId(e.target.value)} required>
                                <option value="">Selecione o plantio...</option>
                                {ciclos.map(c => <option key={c.id} value={c.id}>{c.cultura_nome} ({c.talhao_nome})</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo de Atividade *</label>
                            <select className={styles.select} value={tipo} onChange={e => setTipo(e.target.value)} required>
                                <option value="OBSERVACAO">Observação (Pragas, Crescimento)</option>
                                <option value="REGA">Rega / Irrigação</option>
                                <option value="INSUMO">Aplicação de Insumo / Adubo</option>
                                <option value="COLHEITA">Colheita</option>
                                <option value="OUTRO">Outra Operação</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Detalhes / Observações *</label>
                            <textarea 
                                className={styles.textarea} 
                                value={descricao} 
                                onChange={e => setDescricao(e.target.value)} 
                                placeholder="Descreva o que foi feito ou observado..."
                                required 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Quantidade (Opcional)</label>
                            <input 
                                className={styles.input} 
                                value={quantidade} 
                                onChange={e => setQuantidade(e.target.value)} 
                                placeholder="Ex: 50L de água, 2kg de adubo, 10kg colhidos"
                            />
                        </div>

                        {/* NOVO CAMPO: Upload de Arquivo/Foto */}
                        <div className={styles.formGroup} style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px dashed #E2E8F0' }}>
                            <label className={styles.label}>Anexar Foto ou Arquivo (Opcional)</label>
                            <input 
                                type="file" 
                                ref={arquivoInputRef}
                                accept="image/*,video/*,.pdf" 
                                onChange={handleArquivoChange} 
                                style={{ width: '100%', marginBottom: previewUrl ? '1rem' : '0' }}
                            />
                            
                            {/* Pré-visualização da imagem */}
                            {previewUrl && (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 0.5rem 0' }}>Pré-visualização do Anexo:</p>
                                    <img 
                                        src={previewUrl} 
                                        alt="Preview" 
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', objectFit: 'cover' }} 
                                    />
                                </div>
                            )}
                        </div>
                        
                        <button type="submit" className={styles.button}>
                            {idEdit ? 'Salvar Alterações' : 'Salvar Registro'}
                        </button>
                        {idEdit && <button type="button" onClick={limparFormulario} className={styles.button} style={{ backgroundColor: '#64748B', marginTop: '0.5rem' }}>Cancelar</button>}
                    </form>
                </div>

                {/* Histórico e Tabela */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Histórico de Operações</h2>
                    <div className={styles.searchContainer}>
                        <input type="text" placeholder="🔍 Pesquisar por cultura, descrição ou autor..." value={termoPesquisa} onChange={(e) => setTermoPesquisa(e.target.value)} className={styles.searchInput} />
                    </div>

                    {loading ? <p>Carregando diário...</p> : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('data_registo')}>Data {renderSortIcon('data_registo')}</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('tipo')}>Atividade {renderSortIcon('tipo')}</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('cultura_nome')}>Plantio {renderSortIcon('cultura_nome')}</th>
                                        <th>Detalhes</th>
                                        <th className={styles.sortableHeader} onClick={() => handleSort('autor_nome')}>Autor {renderSortIcon('autor_nome')}</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registosFiltrados.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum registro encontrado.</td></tr>
                                    ) : (
                                        registosFiltrados.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                                    {new Date(r.data_registo).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${styles['tipo_' + r.tipo.toLowerCase()]}`}>
                                                        {r.tipo_display}
                                                    </span>
                                                </td>
                                                <td>
                                                    <strong>{r.cultura_nome}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.talhao_nome}</div>
                                                </td>
                                                <td style={{ maxWidth: '250px' }}>
                                                    <div style={{ fontSize: '0.875rem' }}>{r.descricao}</div>
                                                    {r.quantidade && <div style={{ fontSize: '0.8rem', color: '#2D5A27', marginTop: '4px', fontWeight: 'bold' }}>Qtd: {r.quantidade}</div>}
                                                    
                                                    {/* NOVO: Link para ver o anexo se existir */}
                                                    {r.anexo && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <a href={r.anexo} target="_blank" rel="noopener noreferrer" style={{ color: '#2D5A27', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                📎 Ver Anexo/Foto
                                                            </a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.85rem' }}>{r.autor_nome}</td>
                                                <td>
                                                    <button type="button" onClick={() => handleEditar(r)} className={`${styles.actionButton} ${styles.editBtn}`}>Editar</button>
                                                    <button type="button" onClick={() => handleExcluir(r.id)} className={`${styles.actionButton} ${styles.deleteBtn}`}>Excluir</button>
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