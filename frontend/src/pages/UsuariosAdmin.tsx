import React, { useState, useEffect } from 'react';
import api from '../services/api';
import styles from './UsuariosAdmin.module.css';

export default function UsuariosAdmin() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados do Formulário
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DISCENTE');

    // Busca os usuários assim que a tela abre
    const carregarUsuarios = async () => {
        try {
            const response = await api.get('/accounts/users/');
            setUsuarios(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            alert("Erro ao carregar lista de usuários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarUsuarios();
    }, []);

    // Função para cadastrar novo usuário
    const handleCriarUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/accounts/users/', {
                username,
                email,
                password,
                role
            });
            alert('Usuário cadastrado com sucesso!');
            // Limpa o formulário
            setUsername(''); setEmail(''); setPassword(''); setRole('DISCENTE');
            // Recarrega a tabela para mostrar o novo usuário
            carregarUsuarios();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar usuário. Verifique os dados.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestão de Usuários</h1>
                <p>Controle de acessos e perfis do CampoLog.</p>
            </div>

            <div className={styles.grid}>
                {/* Lado Esquerdo: Formulário de Cadastro */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Novo Usuário</h2>
                    <form onSubmit={handleCriarUsuario}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nome de Usuário (Login)</label>
                            <input type="text" className={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>E-mail</label>
                            <input type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Senha Temporária</label>
                            <input type="password" className={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Papel (Role)</label>
                            <select className={styles.select} value={role} onChange={e => setRole(e.target.value)}>
                                <option value="DISCENTE">Discente (Aluno)</option>
                                <option value="DOCENTE">Docente (Professor)</option>
                                <option value="AUDITOR">Auditor</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.button}>Cadastrar Usuário</button>
                    </form>
                </div>

                {/* Lado Direito: Tabela de Usuários */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Usuários Cadastrados</h2>
                    {loading ? <p>Carregando...</p> : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Usuário</th>
                                        <th>E-mail</th>
                                        <th>Papel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map(user => (
                                        <tr key={user.id}>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>
                                                    {user.role}
                                                </span>
                                            </td>
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