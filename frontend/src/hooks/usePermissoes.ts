import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export function usePermissoes() {
    const { user } = useContext(AuthContext);
    const role = user?.role || 'AUDITOR';

    return {
        podeInserir:    ['ADMIN', 'DOCENTE', 'DISCENTE'].includes(role),
        podeEditar:     ['ADMIN', 'DOCENTE', 'DISCENTE'].includes(role),
        podeExcluir:    ['ADMIN', 'DOCENTE'].includes(role),
        somenteLeitura: role === 'AUDITOR',
        isAdmin:        role === 'ADMIN',
    };
}
