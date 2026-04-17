import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[]; // Array opcional com os papéis permitidos na rota
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useContext(AuthContext);

    // 1. Se ainda está lendo o token do navegador, mostra carregando
    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando CampoLog...</div>;
    }

    // 2. Se não tem usuário logado, manda pro Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Se a rota exige um papel específico (ex: ADMIN) e o usuário não tem, manda pro início
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert("Acesso Negado: Você não tem permissão para acessar esta área.");
        return <Navigate to="/" replace />;
    }

    // 4. Se passou por todas as barreiras, renderiza a tela solicitada (<Outlet />)
    return <Outlet />;
}