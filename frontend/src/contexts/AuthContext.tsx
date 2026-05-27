import React, { createContext, useState, useEffect, ReactNode } from 'react';

// 1. Definimos os Tipos (A magia do TypeScript)
interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  // Pode adicionar outros campos que venham do seu Django
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  unidadeAtiva: string | null;
  loading: boolean;
  login: (tokenData: string, userData: User) => void;
  selecionarUnidade: (unidadeId: string | number) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// 2. Criação do Contexto já com a tipagem correta
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // A NOVA VARIÁVEL: Guarda o ID da Unidade Produtiva (Talhão/Fazenda)
  const [unidadeAtiva, setUnidadeAtiva] = useState<string | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Quando a aplicação abre, vamos buscar os dados na "memória" do navegador
    const storedToken = localStorage.getItem('@CampoLog:token');
    const storedUser = localStorage.getItem('@CampoLog:user');
    const storedUnidade = localStorage.getItem('@CampoLog:unidadeAtiva');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Se ele já tinha escolhido uma unidade antes de fechar o app, restauramos!
    if (storedUnidade) {
      setUnidadeAtiva(storedUnidade);
    }

    setLoading(false);
  }, []);

  // Passo 1 do Login (Guarda apenas credenciais do utilizador)
  const login = (tokenData: string, userData: User) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('@CampoLog:token', tokenData);
    localStorage.setItem('@CampoLog:user', JSON.stringify(userData));
  };

  // Passo 2 do Login (Guarda a Unidade escolhida)
  const selecionarUnidade = (unidadeId: string | number) => {
    const idString = String(unidadeId);
    setUnidadeAtiva(idString);
    localStorage.setItem('@CampoLog:unidadeAtiva', idString);
  };

  // Limpeza total ao sair
  const logout = () => {
    setToken(null);
    setUser(null);
    setUnidadeAtiva(null);
    localStorage.removeItem('@CampoLog:token');
    localStorage.removeItem('@CampoLog:user');
    localStorage.removeItem('@CampoLog:unidadeAtiva');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        unidadeAtiva,
        loading,
        login,
        selecionarUnidade,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};