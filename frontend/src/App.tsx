import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { offlineQueue } from './utils/offlineQueue';
import { useEffect, useContext } from 'react';

// Importação das nossas Páginas e Componentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import UsuariosAdmin from './pages/UsuariosAdmin';
import Culturas from './pages/Culturas';
import Talhoes from './pages/Talhoes';
import Ciclos from './pages/Ciclos';
import DiarioCampo from './pages/DiarioCampo';
import Rastreabilidade from './pages/Rastreabilidade';
import SelecionarUnidade from './pages/SelecionarUnidade';
import Unidades from './pages/Unidades'; // ➡️ Garanta que importou corretamente aqui

function AppRoutes() {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            {/* ROTA PÚBLICA: Se o utilizador já estiver logado, vai para a raiz */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/rastreabilidade/:id" element={<Rastreabilidade />} />
            
            {/* ROTAS PROTEGIDAS POR LOGIN: Tudo aqui dentro exige que o utilizador tenha sessão ativa */}
            <Route element={<ProtectedRoute />}>
                
                {/* 1. O ecrã de seleção de unidade: Exige apenas LOGIN, não exige unidade ativa */}
                <Route path="/selecionar-unidade" element={<SelecionarUnidade />} />
                
                {/* 2. O Painel Principal (Raiz): A validação da Unidade Ativa ocorre dentro do próprio Dashboard */}
                <Route path="/" element={<Dashboard />} />
                
                {/* Rotas exclusivas para ADMIN */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                    <Route path="/usuarios" element={<UsuariosAdmin />} />
                    <Route path="/unidades" element={<Unidades />} />
                </Route>
                
                {/* Outras rotas do sistema móvel */}
                <Route path="/culturas" element={<Culturas />} />
                <Route path="/talhoes" element={<Talhoes />} />
                <Route path="/ciclos" element={<Ciclos />} />
                <Route path="/diario" element={<DiarioCampo />} />
            </Route>

            {/* ROTA CORINGA: Redireciona qualquer URL inválida para o início */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    // Gatilho que observa a internet do dispositivo para o PWA
    useEffect(() => {
        offlineQueue.sincronizarPendentes();
        window.addEventListener('online', offlineQueue.sincronizarPendentes);
        return () => {
            window.removeEventListener('online', offlineQueue.sincronizarPendentes);
        };
    }, []);

    return (
        <Router>
            <AppRoutes />
        </Router>
    );
}