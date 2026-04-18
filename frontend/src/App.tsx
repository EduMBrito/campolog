import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';

// Importação das nossas Páginas e Componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import UsuariosAdmin from './pages/UsuariosAdmin';
import Culturas from './pages/Culturas';
import Talhoes from './pages/Talhoes';
import Ciclos from './pages/Ciclos';
import DiarioCampo from './pages/DiarioCampo';


function AppRoutes() {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            {/* ROTA PÚBLICA: Se o usuário já estiver logado e tentar ir pro /login, joga ele pro Dashboard */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

            {/* ROTAS PROTEGIDAS: Tudo que estiver aqui dentro passa pelo nosso Guarda de Segurança */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                
                {/* Futura tela de Usuários: Apenas ADMIN poderá acessar! */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/usuarios" element={<UsuariosAdmin />} />
                
                {/* Rotas do Módulo 2 */}
                <Route path="/culturas" element={<Culturas />} />
                <Route path="/talhoes" element={<Talhoes />} />
                <Route path="/ciclos" element={<Ciclos />} />

                {/* Rotas do Módulo 3 */}
                <Route path="/diario" element={<DiarioCampo />} />
                </Route> */
            </Route>

            
            {/* ROTA CORINGA: Digitou uma URL que não existe? Manda pro Início */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}