import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import api from '../services/api';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/token/', { username, password });

            const token = response.data.access;

            // Resolve o papel com fallback seguro
            let roleFinal = 'DISCENTE';
            if (response.data.user?.role) {
                roleFinal = response.data.user.role;
            } else if (response.data.role) {
                roleFinal = response.data.role;
            } else if (response.data.user?.is_superuser || response.data.is_superuser) {
                roleFinal = 'ADMIN';
            }

            const userData = {
                id: response.data.user?.id || response.data.id,
                username: response.data.user?.username || response.data.username || username,
                role: roleFinal.toUpperCase().trim(),
            };

            login(token, userData);
            navigate('/selecionar-unidade');

        } catch (err) {
            console.error("Erro no login:", err);
            setError('Usuário ou senha incorretos ou erro de conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>

                <div className={styles.header}>
                    <img src={logoImg} alt="Logo CampoLog" className={styles.logo} />
                </div>

                {error && (
                    <div className={styles.errorBox}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username" className={styles.label}>Usuário</label>
                        <input
                            id="username"
                            type="text"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu usuário"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password" className={styles.label}>Senha</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert('Para recuperar sua senha, entre em contato com o Administrador do TI do Instituto ou seu Professor Orientador.'); }}
                        style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                        Esqueci minha senha
                    </a>
                </div>

            </div>
        </div>
    );
}
