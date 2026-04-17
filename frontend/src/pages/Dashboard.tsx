import React, { useContext, useState } from 'react'; // <-- Aqui está a correção principal
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api'; // <-- Importando a nossa API

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    
    // Estado para armazenar a nova senha digitada
    const [novaSenha, setNovaSenha] = useState('');

    // Função para disparar a troca de senha
    const handleTrocarSenha = async () => {
        if (!novaSenha) return alert("Digite a nova senha");
        try {
            await api.patch(`/accounts/users/${user.id}/`, { password: novaSenha });
            alert("Senha alterada com sucesso!");
            setNovaSenha(''); // Limpa o campo após o sucesso
        } catch (error) {
            alert("Erro ao alterar senha. Tente novamente.");
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ color: '#1E293B' }}>Painel Principal</h1>
            <p>Bem-vindo ao CampoLog, <strong>{user?.username}</strong>!</p>
            <p>Seu papel no sistema é: <span style={{ color: '#2D5A27', fontWeight: 'bold' }}>{user?.role}</span></p>
            
            {/* Link exclusivo do ADMIN para gerenciar usuários */}
            {user?.role === 'ADMIN' && (
                <Link to="/usuarios" style={{ display: 'inline-block', marginTop: '1rem', marginBottom: '1rem', color: '#2D5A27', textDecoration: 'none', fontWeight: 'bold', border: '1px solid #2D5A27', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                    ⚙️ Acessar Gestão de Usuários
                </Link>
            )}

            {/* Bloco de Segurança: Trocar a própria senha */}
            <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: 'white' }}>
                <h3 style={{ marginTop: 0, color: '#1E293B' }}>Segurança da Conta</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="password" 
                        placeholder="Digite sua nova senha" 
                        value={novaSenha} 
                        onChange={e => setNovaSenha(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0', flex: 1 }}
                    />
                    <button 
                        onClick={handleTrocarSenha} 
                        style={{ padding: '0.75rem 1.5rem', backgroundColor: '#1E293B', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Alterar Senha
                    </button>
                </div>
            </div>

            {/* Botão de Sair */}
            <button 
                onClick={logout}
                style={{
                    marginTop: '2rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%'
                }}
            >
                Sair do Sistema (Logout)
            </button>
        </div>
    );
}