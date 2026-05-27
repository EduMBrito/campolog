import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ROLE_LABEL: Record<string, string> = {
    ADMIN: 'Administrador',
    DOCENTE: 'Docente',
    DISCENTE: 'Discente',
    AUDITOR: 'Auditor',
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    ADMIN:    { bg: '#FEE2E2', color: '#991B1B' },
    DOCENTE:  { bg: '#DBEAFE', color: '#1E40AF' },
    DISCENTE: { bg: '#D1FAE5', color: '#065F46' },
    AUDITOR:  { bg: '#F3E8FF', color: '#6B21A8' },
};

export default function Unidades() {
    const [unidades, setUnidades] = useState<any[]>([]);
    const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
    const [unidadeSelecionada, setUnidadeSelecionada] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Form de unidade
    const [idEdit, setIdEdit] = useState<number | null>(null);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [cidade, setCidade] = useState('');
    const [ativo, setAtivo] = useState(true);

    // Adicionar usuário
    const [usuarioParaAdicionar, setUsuarioParaAdicionar] = useState('');

    useEffect(() => {
        carregarUnidades();
        carregarTodosUsuarios();
    }, []);

    const carregarUnidades = async () => {
        try {
            setLoading(true);
            const res = await api.get('/caderno/unidades/');
            setUnidades(res.data);
        } catch (error) {
            console.error('Erro ao carregar unidades:', error);
        } finally {
            setLoading(false);
        }
    };

    const carregarTodosUsuarios = async () => {
        try {
            const res = await api.get('/accounts/todos-usuarios/');
            setTodosUsuarios(res.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { nome, cnpj_ou_codigo: cnpj, cidade, ativo };
            if (idEdit !== null) {
                await api.patch(`/caderno/unidades/${idEdit}/`, payload);
                alert('Unidade produtiva atualizada com sucesso!');
            } else {
                await api.post('/caderno/unidades/', payload);
                alert('Unidade produtiva cadastrada com sucesso!');
            }
            limparFormulario();
            carregarUnidades();
        } catch (error: any) {
            console.error('Erro ao salvar unidade:', error.response?.data || error.message);
            alert('Erro ao salvar. Verifique os dados e tente novamente.');
        }
    };

    const handleEditar = (u: any) => {
        setIdEdit(u.id);
        setNome(u.nome || '');
        setCnpj(u.cnpj_ou_codigo || '');
        setCidade(u.cidade || '');
        setAtivo(u.ativo ?? true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number, nomeUnidade: string) => {
        if (!window.confirm(`Excluir "${nomeUnidade}"? Todos os dados vinculados serão perdidos.`)) return;
        try {
            await api.delete(`/caderno/unidades/${id}/`);
            if (unidadeSelecionada?.id === id) setUnidadeSelecionada(null);
            carregarUnidades();
        } catch {
            alert('Não foi possível excluir. A unidade pode ter dados vinculados.');
        }
    };

    const handleSelecionarUnidade = async (u: any) => {
        try {
            const res = await api.get(`/caderno/unidades/${u.id}/`);
            setUnidadeSelecionada(res.data);
            setUsuarioParaAdicionar('');
        } catch (error) {
            console.error('Erro ao carregar detalhe da unidade:', error);
        }
    };

    const handleAdicionarUsuario = async () => {
        if (!usuarioParaAdicionar || !unidadeSelecionada) return;
        try {
            await api.post(`/caderno/unidades/${unidadeSelecionada.id}/adicionar-usuario/`, {
                usuario_id: Number(usuarioParaAdicionar),
            });
            setUsuarioParaAdicionar('');
            handleSelecionarUnidade(unidadeSelecionada);
            carregarUnidades();
        } catch (error: any) {
            alert('Erro ao adicionar usuário.');
        }
    };

    const handleRemoverUsuario = async (usuarioId: number, usuarioNome: string) => {
        if (!window.confirm(`Remover ${usuarioNome} desta unidade?`)) return;
        try {
            await api.post(`/caderno/unidades/${unidadeSelecionada.id}/remover-usuario/`, {
                usuario_id: usuarioId,
            });
            handleSelecionarUnidade(unidadeSelecionada);
            carregarUnidades();
        } catch {
            alert('Erro ao remover usuário.');
        }
    };

    const limparFormulario = () => {
        setIdEdit(null);
        setNome('');
        setCnpj('');
        setCidade('');
        setAtivo(true);
    };

    const idsNaUnidade = new Set((unidadeSelecionada?.usuarios || []).map((u: any) => u.id));
    const usuariosDisponiveis = todosUsuarios.filter(u => !idsNaUnidade.has(u.id));

    return (
        <div style={{ padding: '2rem', maxWidth: '1300px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Unidades Produtivas</h1>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.3rem' }}>Gerencie os campi e fazendas e os usuários vinculados a cada uma.</p>
                </div>
                <Link to="/" style={{ color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>&larr; Voltar ao Painel</Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '2rem', alignItems: 'start' }}>

                {/* COLUNA ESQUERDA: FORMULÁRIO + LISTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* FORMULÁRIO */}
                    <form onSubmit={handleSalvar} style={{ background: '#ffffff', padding: '1.8rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', borderTop: '4px solid #2D5A27' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#1E293B', marginBottom: '1.2rem' }}>
                            {idEdit !== null ? '✏️ Editar Unidade' : '🏢 Nova Unidade Produtiva'}
                        </h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#1E293B', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Nome *</label>
                            <input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Campus Petrolina Zona Rural"
                                style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#1E293B', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Identificação</label>
                                <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="Opcional"
                                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#1E293B', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Local</label>
                                <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Opcional"
                                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #E2E8F0', fontSize: '0.9rem' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                            <input type="checkbox" id="ativo" checked={ativo} onChange={e => setAtivo(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                            <label htmlFor="ativo" style={{ fontWeight: '600', color: '#1E293B', fontSize: '0.9rem', cursor: 'pointer' }}>Unidade ativa</label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="submit" style={{ padding: '0.6rem 1.3rem', backgroundColor: '#2D5A27', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {idEdit !== null ? 'Salvar Alterações' : 'Cadastrar'}
                            </button>
                            {idEdit !== null && (
                                <button type="button" onClick={limparFormulario} style={{ padding: '0.6rem 1rem', backgroundColor: '#64748B', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>

                    {/* LISTA DE UNIDADES */}
                    <div style={{ background: '#ffffff', padding: '1.8rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)' }}>
                        <h2 style={{ fontSize: '1.1rem', color: '#1E293B', marginBottom: '1rem' }}>Unidades Cadastradas</h2>

                        {loading ? (
                            <p style={{ color: '#64748B' }}>Carregando...</p>
                        ) : unidades.length === 0 ? (
                            <p style={{ color: '#64748B', textAlign: 'center', padding: '1.5rem' }}>Nenhuma unidade cadastrada.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {unidades.map(u => (
                                    <div
                                        key={u.id}
                                        onClick={() => handleSelecionarUnidade(u)}
                                        style={{
                                            padding: '0.9rem 1rem', borderRadius: '6px', border: '1px solid',
                                            borderColor: unidadeSelecionada?.id === u.id ? '#2D5A27' : '#E2E8F0',
                                            backgroundColor: unidadeSelecionada?.id === u.id ? '#F0FDF4' : '#F8FAFC',
                                            cursor: 'pointer', transition: 'all 0.15s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '0.95rem' }}>{u.nome}</span>
                                                {u.cidade && <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: '0.5rem' }}>📍 {u.cidade}</span>}
                                                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                                                    👥 {u.total_usuarios} usuário{u.total_usuarios !== 1 ? 's' : ''}
                                                    {!u.ativo && <span style={{ marginLeft: '0.5rem', color: '#DC2626' }}>• Inativa</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.3rem' }} onClick={e => e.stopPropagation()}>
                                                <button type="button" onClick={() => handleEditar(u)}
                                                    style={{ padding: '0.25rem 0.5rem', backgroundColor: '#1E293B', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                    Editar
                                                </button>
                                                <button type="button" onClick={() => handleExcluir(u.id, u.nome)}
                                                    style={{ padding: '0.25rem 0.5rem', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}>
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUNA DIREITA: PAINEL DE USUÁRIOS DA UNIDADE */}
                <div style={{ background: '#ffffff', padding: '1.8rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08)', minHeight: '300px' }}>
                    {!unidadeSelecionada ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#94A3B8', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
                            <p style={{ fontSize: '1rem' }}>Selecione uma unidade ao lado para ver e gerenciar os usuários vinculados.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ borderBottom: '2px solid #F1F5F9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.2rem', color: '#2D5A27', fontWeight: 'bold', margin: 0 }}>{unidadeSelecionada.nome}</h2>
                                {unidadeSelecionada.cidade && <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.2rem' }}>📍 {unidadeSelecionada.cidade}</p>}
                            </div>

                            {/* ADICIONAR USUÁRIO */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                <select
                                    value={usuarioParaAdicionar}
                                    onChange={e => setUsuarioParaAdicionar(e.target.value)}
                                    style={{ flex: 1, padding: '0.55rem 0.7rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#fff' }}
                                >
                                    <option value="">Selecionar usuário para adicionar...</option>
                                    {usuariosDisponiveis.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.username} — {ROLE_LABEL[u.role] || u.role}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAdicionarUsuario}
                                    disabled={!usuarioParaAdicionar}
                                    style={{ padding: '0.55rem 1rem', backgroundColor: usuarioParaAdicionar ? '#2D5A27' : '#CBD5E1', color: '#fff', border: 'none', borderRadius: '4px', cursor: usuarioParaAdicionar ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                                >
                                    + Adicionar
                                </button>
                            </div>

                            {/* LISTA DE USUÁRIOS */}
                            <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#475569', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Usuários com acesso ({unidadeSelecionada.usuarios?.length || 0})
                            </h3>

                            {unidadeSelecionada.usuarios?.length === 0 ? (
                                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '2rem', border: '1px dashed #E2E8F0', borderRadius: '6px' }}>
                                    Nenhum usuário vinculado. Adicione um acima.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {unidadeSelecionada.usuarios.map((u: any) => {
                                        const cores = ROLE_COLORS[u.role] || ROLE_COLORS.DISCENTE;
                                        return (
                                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#ffffff' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', color: '#1E293B', fontSize: '0.9rem' }}>{u.username}</span>
                                                    {u.email && <span style={{ color: '#94A3B8', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{u.email}</span>}
                                                    <div style={{ marginTop: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: cores.bg, color: cores.color }}>
                                                            {ROLE_LABEL[u.role] || u.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoverUsuario(u.id, u.username)}
                                                    style={{ padding: '0.3rem 0.6rem', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                                                >
                                                    Remover
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
