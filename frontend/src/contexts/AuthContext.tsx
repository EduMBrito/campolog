import { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    role: string;
}

interface AuthContextData {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const restaurarSessao = () => {
            try {
                const token = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (token && storedUser) {
                    // Configura o token para todas as futuras chamadas de API
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Recupera os dados do usuário do texto salvo
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    console.log("Sessão restaurada com sucesso:", parsedUser.username);
                }
            } catch (error) {
                console.error("Erro ao recuperar sessão local:", error);
                localStorage.clear(); // Limpa se houver dados corrompidos
            } finally {
                setLoading(false);
            }
        };

        restaurarSessao();
    }, []);

    const login = (token: string, userData: User) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};