import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import styles from './Dashboard.module.css'; // <-- Importando nosso novo design

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const [novaSenha, setNovaSenha] = useState('');

    const handleTrocarSenha = async () => {
        if (!novaSenha) return alert("Digite a nova senha");
        try {
            await api.patch(`/accounts/users/${user.id}/`, { password: novaSenha });
            alert("Senha alterada com sucesso!");
            setNovaSenha('');
        } catch (error) {
            alert("Erro ao alterar senha. Tente novamente.");
        }
    };

    return (
        <div className={styles.container}>
            
            {/* O Cartão Centralizado de Boas-Vindas */}
            <div className={styles.heroCard}>
                <h1 className={styles.heroTitle}>Olá, {user?.username}!</h1>
                <p style={{ color: '#94A3B8', margin: 0 }}>Bem-vindo de volta ao CampoLog.</p>
                <div className={styles.roleBadge}>{user?.role}</div>
            </div>

            <div className={styles.grid}>
                {/* Lado Esquerdo: Navegação */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Módulos do Sistema</h2>
                    
                    {/* Link do Admin */}
                    {user?.role === 'ADMIN' && (
                        <Link to="/usuarios" className={styles.navLink}>
                            ⚙️ Gestão de Usuários
                        </Link>
                    )}

                    {/* Links Gerais */}
                    <Link to="/culturas" className={styles.navLink}>
                        🌱 Catálogo de Culturas
                    </Link>

                    <Link to="/talhoes" className={styles.navLink}>
                        🗺️ Gestão de Talhões
                    </Link>
                    
                    <Link to="/ciclos" className={styles.navLink}>
                        🔄 Gestão de Ciclos de Cultivo
                    </Link>

                    <Link to="/diario" className={styles.navLink}>
                        📝 Diário de Campo (Anotações e Colheitas)
                    </Link>
                </div>

                {/* Lado Direito: Segurança */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Segurança da Conta</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
                        Atualize sua senha de acesso ao sistema.
                    </p>
                    
                    <input 
                        type="password" 
                        placeholder="Digite sua nova senha" 
                        value={novaSenha} 
                        onChange={e => setNovaSenha(e.target.value)}
                        className={styles.input}
                    />
                    <button onClick={handleTrocarSenha} className={styles.actionButton}>
                        Confirmar Alteração
                    </button>
                </div>
            </div>

            {/* O Botão de Sair Discreto no final */}
            <div className={styles.logoutContainer}>
                <button onClick={logout} className={styles.logoutBtn}>
                    Sair do Sistema
                </button>
            </div>

        </div>
    );
}