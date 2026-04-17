import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#1E293B' }}>Painel Principal</h1>
            <p>Bem-vindo ao CampoLog, <strong>{user?.username}</strong>!</p>
            <p>Seu papel no sistema é: <span style={{ color: '#2D5A27', fontWeight: 'bold' }}>{user?.role}</span></p>
            {user?.role === 'ADMIN' && (
                <Link to="/usuarios" style={{ display: 'block', marginTop: '1rem', color: '#2D5A27' }}>
                    ⚙️ Acessar Gestão de Usuários
                </Link>
)}
            
            <button 
                onClick={logout}
                style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Sair do Sistema
            </button>
        </div>
    );
}