import api from './api';

export interface UserInput {
  id?: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'DOCENTE' | 'DISCENTE' | 'AUDITOR';
  password?: string;
}

export const userService = {
  // Lista os usuários da unidade ativa
  getUsuarios: () => api.get<UserInput[]>('accounts/usuarios-unidade/'),
  
  // Cria um novo usuário dentro da unidade ativa
  createUsuario: (dados: UserInput) => api.post('accounts/usuarios-unidade/', dados),
  
  // Remove o acesso do usuário
  deleteUsuario: (id: number) => api.delete(`accounts/usuarios-unidade/${id}/`),
};