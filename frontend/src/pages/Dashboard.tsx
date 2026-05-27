import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { user, unidadeAtiva, loading: ctxLoading, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const nomeUsuarioExibir = user?.username || 'Usuário';
    const perfilUsuario = user?.role || 'Acesso';

    const handleAlternarUnidade = () => {
        localStorage.removeItem('@CampoLog:unidadeAtiva');
        window.location.href = '/selecionar-unidade';
    };

    useEffect(() => {
        if (ctxLoading) return;
        if (!unidadeAtiva) {
            navigate('/selecionar-unidade', { replace: true });
            return;
        }
        carregarMetricasAnaliticas();
    }, [unidadeAtiva, ctxLoading]);

const carregarMetricasAnaliticas = async () => {
        try {
            setLoading(true);
            console.log("Iniciando requisição para /agronomia/dashboard-stats/ com unidade:", unidadeAtiva);
            
            const response = await api.get('/agronomia/dashboard-stats/');
            
            console.log("Resposta recebida do Backend:", response.data);
            setStats(response.data);
            setLoading(false); // 🟢 Movido para cá (Sucesso)
            
        } catch (error: any) {
            console.error("Erro CRÍTICO ao buscar telemetria:", error);
            
            if (error.response) {
                console.error("Status do Erro:", error.response.status);
                console.error("Dados do Erro:", error.response.data);
            }
            setStats(null);
            setLoading(false); // 🟢 Movido para cá (Erro) - Isso VAI destravar a tela!
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', fontFamily: 'sans-serif' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>🔄 Sincronizando telemetria analítica do campus...</p>
            </div>
        );
    }

    return (
        <div className={styles.container || ''} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* BARRA DE TOPO SECURE */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: '#ffffff', 
                padding: '0.8rem 1.5rem', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                marginBottom: '2.5rem',
                border: '1px solid #E2E8F0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Perfil */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#1E293B' }}>
                        <span>👤 Usuário:</span>
                        <strong style={{ color: '#2D5A27' }}>{nomeUsuarioExibir}</strong>
                        <span style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.15rem 0.5rem', 
                            backgroundColor: '#F1F5F9', 
                            color: '#475569', 
                            borderRadius: '4px', 
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                        }}>
                            {perfilUsuario}
                        </span>
                    </div>

                    {/* Unidade Produtiva Logada com Alternador Seguro */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            backgroundColor: '#1E293B', 
                            padding: '0.4rem 1rem', 
                            borderRadius: '20px', 
                            fontSize: '0.85rem', 
                            fontWeight: 'bold', 
                            color: '#ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                        }}>
                            <span>📍 Local:</span>
                            <span style={{ color: '#F59E0B' }}>
                                {stats?.unidade_nome || `Unidade #${unidadeAtiva}`}
                            </span>
                        </div>

                        <button 
                            type="button"
                            onClick={handleAlternarUnidade}
                            style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: '500' }}
                        >
                            (Alternar)
                        </button>
                    </div>
                </div>

                {/* Botão Sair */}
                <div>
                    <button 
                        type="button" 
                        onClick={logout}
                        style={{ padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                        🚪 Sair do Sistema
                    </button>
                </div>
            </div>

            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ color: '#1E293B', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>Painel de Operações Agrícolas</h1>
                <p style={{ color: '#64748B', marginTop: '0.4rem' }}>Visão em tempo real das unidades de trabalho e integridade científica fitossanitária.</p>
            </header>

            {/* SEÇÃO DOS CARDS MÉTRICOS EXPANDIDA PARA 4 COLUNAS */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2rem', marginBottom: '3rem' }}>
                <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderTop: '4px solid #2D5A27' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Talhões</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1E293B', marginTop: '0.4rem' }}>{stats?.total_talhoes || 0}</div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: '#94A3B8' }}>Áreas mapeadas</small>
                </div>

                <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderTop: '4px solid #F59E0B' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Ciclos Ativos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1E293B', marginTop: '0.4rem' }}>{stats?.ciclos_ativos || 0}</div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: '#94A3B8' }}>Culturas em campo</small>
                </div>

                <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderTop: '4px solid #3B82F6' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Registros Diários</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1E293B', marginTop: '0.4rem' }}>{stats?.total_diario || 0}</div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: '#94A3B8' }}>Apontamentos técnicos</small>
                </div>

                <div style={{ background: '#ffffff', padding: '1.2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', borderTop: '4px solid #1E293B' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Espécies</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1E293B', marginTop: '0.4rem' }}>{stats?.culturas_cadastradas || 0}</div>
                    <small style={{ display: 'block', marginTop: '0.3rem', color: '#94A3B8' }}>Catálogo global</small>
                </div>
            </section>

            {/* ACESSO RÁPIDO E TIMELINE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', alignItems: 'start' }}>
                <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0, marginBottom: '1.5rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '0.75rem' }}>Módulos</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {user?.role === 'ADMIN' && (
                            <Link to="/usuarios" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>👥 Gestão de Usuários</Link>
                        )}
                        {user?.role === 'ADMIN' && (
                            <Link to="/unidades" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>🏢 Unidades Produtivas</Link>
                        )}
                        <Link to="/culturas" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>🍇 Biblioteca Global de Culturas</Link>
                        <Link to="/talhoes" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>🗺️ Parcelas e Talhões</Link>
                        <Link to="/ciclos" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>⏳ Ciclos de Cultivo</Link>
                        <Link to="/diario" style={{ display: 'block', padding: '0.75rem 1rem', background: '#F8FAFC', color: '#1E293B', textDecoration: 'none', borderRadius: '4px', fontWeight: '600', border: '1px solid #E2E8F0' }}>🌱 Diário de Campo</Link>
                    </div>
                </div>

                <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.2rem', color: '#1E293B', margin: 0 }}>📋 Últimos Apontamentos de Campo</h2>
                        <Link to="/diario" style={{ fontSize: '0.85rem', color: '#2D5A27', fontWeight: 'bold', textDecoration: 'none' }}>Ver diário completo &rarr;</Link>
                    </div>

                    {!stats?.ultimas_atividades || stats.ultimas_atividades.length === 0 ? (
                        <p style={{ color: '#64748B', textAlign: 'center', padding: '2rem' }}>Nenhuma atividade registrada neste campus ainda.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.ultimas_atividades.map((atv: any) => (
                                <div key={atv.id} style={{ padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#F8FAFC', borderLeft: atv.tipo === 'OBSERVACAO' ? '4px solid #F59E0B' : '4px solid #2D5A27' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                        <span style={{ fontWeight: 'bold', color: '#1E293B' }}>{atv.cultura_nome}</span>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold',
                                            backgroundColor: atv.tipo === 'OBSERVACAO' ? '#FFF3E0' : '#E8F5E9',
                                            color: atv.tipo === 'OBSERVACAO' ? '#E65100' : '#2D5A27'
                                        }}>
                                            {atv.tipo}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 0.5rem 0', color: '#334155', fontSize: '0.9rem', lineHeight: '1.4' }}>{atv.descricao}</p>
                                    <small style={{ color: '#94A3B8' }}>📅 Registrado por <strong>{atv.autor_nome || 'Bolsista'}</strong></small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}