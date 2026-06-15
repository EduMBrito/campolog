import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { usePermissoes } from '../hooks/usePermissoes';
import { offlineQueue } from '../utils/offlineQueue';
import styles from './DiarioCampo.module.css';

export default function Diario() {
    const { unidadeAtiva } = useContext(AuthContext);
    const { podeEditar, podeExcluir, somenteLeitura } = usePermissoes();

    // Estados de carregamento e listagem
    const [registros, setRegistros] = useState<any[]>([]);
    const [ciclosOpcoes, setCiclosOpcoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // 🟢 CORREÇÃO 1: Estados do Formulário mapeados 100% com o TIPO_CHOICES do Django
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [cicloId, setCicloId] = useState('');
    const [tipo, setTipo] = useState('REGA'); // Inicia com 'REGA' que é uma escolha válida
    const [dataAtividade, setDataAtividade] = useState(new Date().toISOString().split('T')[0]);
    const [detalhesTexto, setDetalhesTexto] = useState('');

    // Campos auxiliares para estruturação automática da descrição agronômica (Normas BPA)
    const [estadioFenologico, setEstadioFenologico] = useState('CRESCIMENTO');
    const [severidadePraga, setSeveridadePraga] = useState('BAIXA');
    const [nomeInsumo, setNomeInsumo] = useState('');

    // Anexo de mídia
    const [arquivoAnexo, setArquivoAnexo] = useState<File | null>(null);
    const [previewAnexo, setPreviewAnexo] = useState<string | null>(null);
    const refAnexo = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Filtro por tipo no histórico
    const [filtroTipo, setFiltroTipo] = useState('');

    // Estado de conectividade e fila offline (M8)
    const [online, setOnline] = useState(navigator.onLine);
    const [pendentes, setPendentes] = useState(0);

    const atualizarPendentes = async () => {
        setPendentes(await offlineQueue.contarPendentes());
    };

    // Monitora a troca de Campus para atualizar os dados em tempo de execução
    useEffect(() => {
        if (unidadeAtiva) {
            carregarCiclosDoCampus();
            carregarRegistrosDoDiario();
        }
    }, [unidadeAtiva]);

    // Acompanha conectividade: ao voltar a rede, sincroniza a fila e recarrega.
    useEffect(() => {
        atualizarPendentes();
        const handleOnline = async () => {
            setOnline(true);
            await offlineQueue.sincronizarPendentes();
            await atualizarPendentes();
            carregarRegistrosDoDiario();
        };
        const handleOffline = () => setOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const carregarCiclosDoCampus = async () => {
        try {
            const response = await api.get('/agronomia/ciclos/');
            setCiclosOpcoes(response.data);
        } catch (error) {
            console.error("Erro ao carregar ciclos para o seletor:", error);
        }
    };

    const carregarRegistrosDoDiario = async () => {
        try {
            setLoading(true);
            const response = await api.get('/caderno/diario/');
            setRegistros(response.data);
        } catch (error) {
            console.error("Erro ao carregar lançamentos do diário:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setArquivoAnexo(file);
        if (file && file.type.startsWith('image/')) {
            setPreviewAnexo(URL.createObjectURL(file));
        } else {
            setPreviewAnexo(null);
        }
    };

    // Enfileira o registro no IndexedDB para envio posterior (fallback offline).
    // Disponível apenas para novos registros — edição offline exige conexão.
    const salvarOffline = async (descricao: string) => {
        await offlineQueue.salvar({
            ciclo: Number(cicloId),
            tipo,
            descricao,
            anexo: arquivoAnexo,
            anexoNome: arquivoAnexo?.name,
        });
        await atualizarPendentes();
        alert('📴 Sem conexão. Registro salvo no dispositivo e será enviado automaticamente quando a internet voltar.');
        limparFormulario();
        carregarRegistrosDoDiario();
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        let descricaoCompilada = detalhesTexto;
        if (tipo === 'OBSERVACAO') {
            descricaoCompilada = `[Estado: ${estadioFenologico}] [Severidade Praga: ${severidadePraga}] ${detalhesTexto}`;
        } else if (tipo === 'INSUMO' && nomeInsumo) {
            descricaoCompilada = `[Produto/Insumo: ${nomeInsumo}] ${detalhesTexto}`;
        }
        descricaoCompilada = descricaoCompilada.trim();

        // Sem internet: enfileira novos registros para sincronização futura.
        if (!navigator.onLine && idEdit === null) {
            await salvarOffline(descricaoCompilada);
            return;
        }

        try {
            if (arquivoAnexo) {
                const formData = new FormData();
                formData.append('ciclo', String(Number(cicloId)));
                formData.append('tipo', tipo);
                formData.append('descricao', descricaoCompilada);
                formData.append('anexo', arquivoAnexo);
                const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
                if (idEdit !== null) {
                    await api.patch(`/caderno/diario/${idEdit}/`, formData, cfg);
                } else {
                    await api.post('/caderno/diario/', formData, cfg);
                }
            } else {
                const payload = { ciclo: Number(cicloId), tipo, descricao: descricaoCompilada };
                if (idEdit !== null) {
                    await api.patch(`/caderno/diario/${idEdit}/`, payload);
                } else {
                    await api.post('/caderno/diario/', payload);
                }
            }

            alert(idEdit !== null ? 'Registro atualizado com sucesso!' : 'Atividade registrada com sucesso!');
            limparFormulario();
            carregarRegistrosDoDiario();
        } catch (error: any) {
            // Falha de rede (sem resposta do servidor) num registro novo:
            // a conexão caiu durante o envio → guarda offline em vez de perder.
            if (idEdit === null && !error.response) {
                await salvarOffline(descricaoCompilada);
                return;
            }
            console.error('Erro ao salvar no diário:', error.response?.data || error.message);
            alert('Erro ao salvar lançamento. Verifique os dados inseridos.');
        }
    };

    const handleEditar = (reg: any) => {
        setIdEdit(reg.id);
        setCicloId(String(reg.ciclo?.id || reg.ciclo));
        setTipo(reg.tipo);
        const dataRaw = reg.data_atividade || reg.data_registo || '';
        setDataAtividade(dataRaw.substring(0, 10));
        setDetalhesTexto(reg.descricao || '');
        setNomeInsumo('');
        setArquivoAnexo(null);
        setPreviewAnexo(null);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleExcluir = async (id: number) => {
        if (window.confirm('Deseja realmente apagar este registro do diário de campo?')) {
            try {
                await api.delete(`/caderno/diario/${id}/`);
                alert('Registro removido.');
                carregarRegistrosDoDiario();
            } catch (error) {
                console.error('Erro ao remover do diário:', error);
                alert('Não foi possível excluir o registro.');
            }
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setCicloId('');
        setTipo('REGA');
        setDataAtividade(new Date().toISOString().split('T')[0]);
        setDetalhesTexto('');
        setNomeInsumo('');
        setArquivoAnexo(null);
        setPreviewAnexo(null);
        if (refAnexo.current) refAnexo.current.value = '';
    };

    const registrosFiltrados = registros
        .filter(reg => filtroTipo === '' || reg.tipo === filtroTipo)
        .filter(reg => {
            if (termoPesquisa === '') return true;
            const busca = termoPesquisa.toLowerCase();
            const texto = reg.descricao?.toLowerCase() || '';
            const cultura = (reg.cultura_nome || reg.ciclo_detalhes?.cultura || '').toLowerCase();
            const talhao = (reg.talhao_nome || reg.ciclo_detalhes?.talhao || '').toLowerCase();
            return texto.includes(busca) || cultura.includes(busca) || talhao.includes(busca);
        });

    return (
        <div className={styles.container || ''} style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Diário de Intervenções e Ocorrências</h1>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.3rem' }}>Caderno de campo digitalizado integrado à governança técnica do campus.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {(!online || pendentes > 0) && (
                        <span
                            title={online
                                ? 'Registros aguardando envio ao servidor'
                                : 'Sem conexão — novos registros ficam salvos no dispositivo'}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                backgroundColor: '#FEF3C7', color: '#92400E',
                                border: '1px solid #F59E0B', borderRadius: '999px',
                                padding: '0.35rem 0.8rem', fontSize: '0.8rem', fontWeight: 600,
                            }}
                        >
                            {!online && '📴 Offline'}
                            {!online && pendentes > 0 && ' · '}
                            {pendentes > 0 && `⏳ ${pendentes} pendente${pendentes > 1 ? 's' : ''}`}
                        </span>
                    )}
                    <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>&larr; Voltar ao Painel</Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: somenteLeitura ? '1fr' : '1fr 1.3fr', gap: '2rem', alignItems: 'start' }}>

                {!somenteLeitura && (
                <form ref={formRef} onSubmit={handleSalvar} style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: '4px solid #2D5A27' }}>
                    <h2>{idEdit !== null ? '✏️ Editar Apontamento' : '🌱 Registrar Atividade'}</h2>

                    <div style={{ marginBottom: '1.2rem', marginTop: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Vincular ao Lote / Cultura Ativa</label>
                        <select value={cicloId} onChange={(e) => setCicloId(e.target.value)} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#ffffff' }}>
                            <option value="">Selecione o plantio alvo...</option>
                            {ciclosOpcoes.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.cultura_nome || c.cultura?.nome} — {c.talhao_nome || c.talhao?.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Data do Manejo</label>
                            <input type="date" value={dataAtividade} onChange={(e) => setDataAtividade(e.target.value)} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Natureza do Registro</label>
                            {/* 🟢 CORREÇÃO 3: Options do seletor alinhadas exatamente com as chaves do Django choices */}
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', background: '#ffffff' }}>
                                <option value="REGA">💧 Rega / Irrigação</option>
                                <option value="INSUMO">🧪 Aplicação de Insumo / Adubo</option>
                                <option value="OBSERVACAO">👁️ Observação (Pragas, Doenças, Fenologia)</option>
                                <option value="COLHEITA">📦 Colheita</option>
                                <option value="OUTRO">⚙️ Outra Operação</option>
                            </select>
                        </div>
                    </div>

                    {/* 🧪 SUB-CAMPO DINÂMICO SE FOR INSUMO */}
                    {tipo === 'INSUMO' && (
                        <div style={{ marginBottom: '1.2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '6px', borderLeft: '4px solid #2D5A27' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B', fontSize: '0.9rem' }}>Identificação do Insumo / Fertilizante</label>
                            <input 
                                type="text"
                                value={nomeInsumo}
                                onChange={(e) => setNomeInsumo(e.target.value)}
                                placeholder="Ex: NPK 10-10-10, Esterco Bovino, Sulfato de Cobre..."
                                required
                                style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                            />
                        </div>
                    )}

                    {/* 👁️ SUB-CAMPOS DINÂMICOS SE FOR OBSERVAÇÃO */}
                    {tipo === 'OBSERVACAO' && (
                        <div style={{ marginBottom: '1.2rem', padding: '1rem', background: '#FFFBEB', borderRadius: '6px', borderLeft: '4px solid #F59E0B', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B', fontSize: '0.9rem' }}>Estado Fenológico</label>
                                <select value={estadioFenologico} onChange={(e) => setEstadioFenologico(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#ffffff' }}>
                                    <option value="EMERGENCIA">Emergência</option>
                                    <option value="CRESCIMENTO">Crescimento Vegetativo</option>
                                    <option value="FLORACAO">Floração</option>
                                    <option value="FRUTIFICACAO">Frutificação</option>
                                    <option value="MATURACAO">Maturação / Secagem</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B', fontSize: '0.9rem' }}>Severidade de Incidências</label>
                                <select value={severidadePraga} onChange={(e) => setSeveridadePraga(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.7rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#ffffff' }}>
                                    <option value="NENHUMA">Nenhuma / Sob Controle</option>
                                    <option value="BAIXA">Baixa (Sintomas leves)</option>
                                    <option value="MEDIA">Média (Alerta de monitoramento)</option>
                                    <option value="CRITICA">🚨 Alta / Urgência Fitossanitária</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', color: '#1E293B' }}>Descrição Detalhada da Operação</label>
                        <textarea rows={4} value={detalhesTexto} onChange={(e) => setDetalhesTexto(e.target.value)} placeholder="Descreva dosagens, volume de calda, quantidade colhida ou anomalias observadas no lote..." required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontFamily: 'inherit', resize: 'vertical' }} />
                    </div>

                    {/* ANEXAR MÍDIA */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '600', color: '#1E293B' }}>Anexar Mídia (opcional)</label>

                        <input ref={refAnexo} type="file" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx" style={{ display: 'none' }} onChange={handleArquivoChange} />
                        <button type="button" onClick={() => refAnexo.current?.click()} style={{ padding: '0.5rem 0.9rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#1E293B' }}>
                            📎 Selecionar Arquivo
                        </button>

                        {arquivoAnexo && (
                            <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {previewAnexo && (
                                    <img src={previewAnexo} alt="preview" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                                )}
                                <span style={{ fontSize: '0.85rem', color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {arquivoAnexo.name}
                                </span>
                                <button type="button" onClick={() => { setArquivoAnexo(null); setPreviewAnexo(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0 }}>
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" style={{ padding: '0.6rem 1.5rem', backgroundColor: '#2D5A27', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {idEdit !== null ? 'Atualizar Lançamento' : 'Gravar no Diário'}
                        </button>
                        {idEdit !== null && (
                            <button type="button" onClick={limparFormulario} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#64748B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
                )}

                {/* 📊 LINHA DO TEMPO (HISTÓRICO) */}
                <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#1E293B', margin: '0 0 0.9rem 0' }}>Histórico de Lançamentos</h2>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#ffffff', flexShrink: 0 }}
                            >
                                <option value="">Todos os Tipos</option>
                                <option value="REGA">💧 Rega / Irrigação</option>
                                <option value="INSUMO">🧪 Aplicação de Insumo</option>
                                <option value="OBSERVACAO">👁️ Observação</option>
                                <option value="COLHEITA">📦 Colheita</option>
                                <option value="OUTRO">⚙️ Outro</option>
                            </select>
                            <input
                                type="text"
                                placeholder="🔍 Filtrar histórico..."
                                value={termoPesquisa}
                                onChange={(e) => setTermoPesquisa(e.target.value)}
                                style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', flex: 1 }}
                            />
                        </div>
                    </div>

                    {loading ? <p style={{ color: '#64748B' }}>A buscar diário de campo do campus...</p> : registrosFiltrados.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum lançamento registrado para esta unidade.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {registrosFiltrados.map((reg) => {
                                // 🟢 CORREÇÃO 4: Estilização dinâmica dos Badges baseada nos tipos oficiais do banco
                                const tipoOficial = reg.tipo || '';
                                const isOcorr = tipoOficial === 'OBSERVACAO';
                                const isRega = tipoOficial === 'REGA';
                                const isInsumo = tipoOficial === 'INSUMO';
                                const isColheita = tipoOficial === 'COLHEITA';

                                return (
                                    <div key={reg.id} style={{ padding: '1.2rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#ffffff', borderLeft: isOcorr ? '5px solid #F59E0B' : isRega ? '5px solid #3B82F6' : isInsumo ? '5px solid #2D5A27' : isColheita ? '5px solid #8B5CF6' : '5px solid #64748B', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.6rem' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '1.05rem' }}>
                                                    {reg.cultura_nome || `Cultivo #${reg.ciccode || reg.ciclo}`}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: '0.5rem' }}>
                                                    📍 Lote: {reg.talhao_nome || 'Área Geral'}
                                                </span>
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', 
                                                backgroundColor: isOcorr ? '#FFF3E0' : isRega ? '#DBEAFE' : isInsumo ? '#E8F5E9' : isColheita ? '#F3E8FF' : '#F1F5F9', 
                                                color: isOcorr ? '#E65100' : isRega ? '#1E40AF' : isInsumo ? '#2D5A27' : isColheita ? '#6B21A8' : '#475569' 
                                            }}>
                                                {isOcorr ? '👁️ OBSERVACAO' : isRega ? '💧 REGA' : isInsumo ? '🧪 INSUMO' : isColheita ? '📦 COLHEITA' : '⚙️ OUTRO'}
                                            </span>
                                        </div>

                                        <p style={{ color: '#334155', fontSize: '0.925rem', margin: '0 0 0.8rem 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            {reg.descricao}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #E2E8F0', paddingTop: '0.6rem' }}>
                                            <small style={{ color: '#94A3B8' }}>
                                                📅 Atividade: {new Date(reg.data_atividade || reg.data_registo).toLocaleDateString('pt-BR')} {reg.autor_nome ? `• Por: ${reg.autor_nome}` : ''}
                                            </small>
                                                {(podeEditar || podeExcluir) && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {podeEditar && (
                                                    <button type="button" onClick={() => handleEditar(reg)}
                                                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#1E293B', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        Editar
                                                    </button>
                                                    )}
                                                    {podeExcluir && (
                                                    <button type="button" onClick={() => handleExcluir(reg.id)}
                                                        style={{ padding: '0.3rem 0.6rem', backgroundColor: '#DC2626', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                                                        Excluir
                                                    </button>
                                                    )}
                                                </div>
                                                )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}