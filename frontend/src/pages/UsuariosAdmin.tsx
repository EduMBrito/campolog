import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import styles from './UsuariosAdmin.module.css';

export default function UsuariosAdmin() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Novo estado para a barra de pesquisa
    const [termoPesquisa, setTermoPesquisa] = useState('');

    // Estados do Formulário
    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('DISCENTE');
    const [isEditing, setIsEditing] = useState(false);

    // Referência para focar no campo após salvar
    const usernameInputRef = useRef<HTMLInputElement>(null);

    const carregarUsuarios = async () => {
        try {
            const response = await api.get('/accounts/users/');
            setUsuarios(response.data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarUsuarios(); }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && userId) {
                const dados: any = { username, email, role };
                if (password) dados.password = password;
                await api.patch(`/accounts/users/${userId}/`, dados);
            } else {
                await api.post('/accounts/users/', { username, email, password, role });
            }
            limparFormulario();
            carregarUsuarios();
        } catch (error) {
            alert('Erro ao salvar. Verifique se o usuário já existe.');
        }
    };

    const handleEditar = (user: any) => {
        setUserId(user.id);
        setUsername(user.username || '');
        setEmail(user.email || '');
        setPassword('');
        setRole(user.role || 'DISCENTE');
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleExcluir = async (id: number, nome: string) => {
        if (window.confirm(`Deseja realmente excluir o usuário ${nome}?`)) {
            try {
                await api.delete(`/accounts/users/${id}/`);
                carregarUsuarios();
            } catch (error) {
                alert('Erro ao excluir. O usuário pode ter registros vinculados.');
            }
        }
    };

    const limparFormulario = () => {
        setUserId(null);
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('DISCENTE');
        setIsEditing(false);
        // Foca de volta no primeiro campo do formulário
        usernameInputRef.current?.focus();
    };

    // Filtro instantâneo da tabela
    const usuariosFiltrados = usuarios.filter(u => {
        const termo = termoPesquisa.toLowerCase();
        return (
            u.username.toLowerCase().includes(termo) ||
            u.email.toLowerCase().includes(termo) ||
            u.role.toLowerCase().includes(termo)
        );
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginBottom: '1rem' }}>
                    &larr; Voltar para o Painel Principal
                </Link>
                <h1 className={styles.title}>Gestão de Usuários</h1>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <form onSubmit={handleSalvar}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Login *</label>
                            <input 
                                ref={usernameInputRef}
                                className={styles.input} 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>E-mail *</label>
                            <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                {isEditing ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                            </label>
                            <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required={!isEditing} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Papel</label>
                            <select className={styles.select} value={role} onChange={e => setRole(e.target.value)}>
                                <option value="DISCENTE">Discente</option>
                                <option value="DOCENTE">Docente</option>
                                <option value="AUDITOR">Auditor</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                        <button type="submit" className={styles.button}>
                            {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={limparFormulario} className={styles.button} style={{ backgroundColor: '#64748B', marginTop: '0.5rem' }}>
                                Cancelar
                            </button>
                        )}
                    </form>
                </div>

                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Lista de Acessos</h2>

                    {/* BARRA DE PESQUISA */}
                    <div className={styles.searchContainer}>
                        <input 
                            type="text" 
                            placeholder="🔍 Pesquisar por nome, e-mail ou papel..." 
                            value={termoPesquisa}
                            onChange={(e) => setTermoPesquisa(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Papel</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuariosFiltrados.length === 0 ? (
                                     <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>Nenhum usuário encontrado.</td></tr>
                                ) : (
                                    usuariosFiltrados.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <strong>{u.username}</strong><br/>
                                                <small style={{color: '#64748B'}}>{u.email}</small>
                                            </td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${styles[u.role.toLowerCase()]}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" onClick={() => handleEditar(u)} style={{color: '#2D5A27', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold', marginRight: '8px'}}>Editar</button>
                                                <button type="button" onClick={() => handleExcluir(u.id, u.username)} style={{color: '#dc2626', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold'}}>Excluir</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}