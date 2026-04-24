import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { agronomiaService } from '../services/agronomiaService';
import { cadernoService } from '../services/cadernoService';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({ 
        total_talhoes: 0, 
        culturas_cadastradas: 0, 
        ciclos_ativos: 0, 
        total_registros: 0 
    });
    const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const userRole = user?.role?.toString().trim().toUpperCase() || '';
    const temAcessoAdmin = userRole === 'ADMIN';

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const [resStats, resDiario] = await Promise.all([
                    agronomiaService.getEstatisticas(),
                    cadernoService.getRegistos()
                ]);
                
                setStats(resStats.data);
                // Pega os 5 registros mais recentes
                setAtividadesRecentes(resDiario.data.slice(0, 5));
            } catch (error) {
                console.error("Erro ao carregar dados do dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        carregarDashboard();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className={styles.title}>Painel Gerencial CampoLog</h1>
                    <p className={styles.subtitle}>
                        Olá, <strong>{user?.username}</strong>. Perfil: <span style={{color: '#2D5A27', fontWeight: 'bold'}}>{userRole}</span>
                    </p>
                </div>
                <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Sair do Sistema
                </button>
            </div>

            {loading ? <p>Atualizando indicadores...</p> : (
                <>
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={`${styles.kpiIcon} ${styles.iconVerde}`}>🔄</div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiValue}>{stats.ciclos_ativos}</span>
                                <span className={styles.kpiLabel}>Plantios Ativos</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={`${styles.kpiIcon} ${styles.iconAzul}`}>📍</div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiValue}>{stats.total_talhoes}</span>
                                <span className={styles.kpiLabel}>Talhões</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={`${styles.kpiIcon} ${styles.iconAmarelo}`}>📝</div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiValue}>{stats.total_registros}</span>
                                <span className={styles.kpiLabel}>Total Diário</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={`${styles.kpiIcon} ${styles.iconRoxo}`}>🌱</div>
                            <div className={styles.kpiInfo}>
                                <span className={styles.kpiValue}>{stats.culturas_cadastradas}</span>
                                <span className={styles.kpiLabel}>Culturas</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.mainGrid}>
                        <div className={styles.panel}>
                            <h2 className={styles.panelTitle}>Módulos do Sistema</h2>
                            <div className={styles.modulesGrid}>
                                {temAcessoAdmin && (
                                    <Link to="/usuarios" className={styles.moduleLink}>
                                        <span className={styles.moduleIcon}>👥</span>
                                        Gestão de Usuários
                                    </Link>
                                )}
                                <Link to="/talhoes" className={styles.moduleLink}>
                                    <span className={styles.moduleIcon}>🗺️</span>
                                    Gestão de Talhões
                                </Link>
                                <Link to="/culturas" className={styles.moduleLink}>
                                    <span className={styles.moduleIcon}>🌾</span>
                                    Catálogo de Culturas
                                </Link>
                                <Link to="/ciclos" className={styles.moduleLink}>
                                    <span className={styles.moduleIcon}>🚜</span>
                                    Ciclos e Rastreio
                                </Link>
                                <Link to="/diario" className={styles.moduleLink}>
                                    <span className={styles.moduleIcon}>📖</span>
                                    Diário de Campo
                                </Link>
                            </div>
                        </div>

                        <div className={styles.panel}>
                            <h2 className={styles.panelTitle}>Últimas Atividades</h2>
                            {atividadesRecentes.length === 0 ? (
                                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Nenhuma anotação recente.</p>
                            ) : (
                                <div className={styles.activityList}>
                                    {atividadesRecentes.map(ativ => (
                                        <div key={ativ.id} className={styles.activityItem}>
                                            <span className={styles.activityDate}>
                                                {new Date(ativ.data_registo).toLocaleDateString('pt-BR')} • {ativ.autor_nome}
                                            </span>
                                            
                                            {/* MELHORIA: Incluindo o Talhão/Lote */}
                                            <span className={styles.activityDesc}>
                                                <strong>{ativ.cultura_nome}</strong> <small style={{color: '#64748B'}}>(Lote: {ativ.talhao_nome})</small>: {ativ.descricao}
                                            </span>
                                            
                                            {/* MELHORIA: Tag colorida dinâmica baseada no tipo */}
                                            <span className={`${styles.activityTag} ${styles['tipo_' + ativ.tipo.toLowerCase()]}`}>
                                                {ativ.tipo_display}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <Link to="/diario" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#2D5A27', textDecoration: 'none', fontWeight: 'bold' }}>
                                Ver diário completo &rarr;
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}