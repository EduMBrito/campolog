import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; // Ajuste o caminho se necessário
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Puxa a função de login da nossa "memória global"
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); // Impede a página de recarregar
        setError('');
        setIsLoading(true);

        try {
            await login(username, password);
            // Se der certo, vamos redirecionar para o painel principal
            navigate('/'); 
        } catch (err) {
            setError('Usuário ou senha incorretos. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                
                <div className={styles.header}>
                    <h1 className={styles.title}>CampoLog</h1>
                    <p className={styles.subtitle}>Transformando manejo em informação</p>
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
                        onClick={() => alert('Para recuperar sua senha, entre em contato com o Administrador do TI do Instituto ou seu Professor Orientador.')}
                        style={{ color: '#64748B', fontSize: '0.875rem', textDecoration: 'none' }}
                    >
                        Esqueci minha senha
                    </a>
</div>

            </div>
        </div>
    );
}