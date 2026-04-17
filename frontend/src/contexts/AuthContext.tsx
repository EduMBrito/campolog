import React, { createContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

// Criamos o contexto avisando ao TypeScript que ele aceita "qualquer coisa" (any) por enquanto
export const AuthContext = createContext<any>(null);

// Aqui tipamos o 'children' como ReactNode
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('access');
            if (token) {
                try {
                    const response = await api.get('/accounts/users/me/');
                    setUser(response.data);
                } catch (error) {
                    console.error("Sessão expirada ou erro ao carregar usuário.");
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (username: string, password: string) => {
        const response = await api.post('/accounts/login/', { username, password });
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        
        const userResponse = await api.get('/accounts/users/me/');
        setUser(userResponse.data);
    };

    const logout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};