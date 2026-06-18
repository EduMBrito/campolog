from rest_framework.permissions import BasePermission, SAFE_METHODS


class RoleBasedPermission(BasePermission):
    """
    AUDITOR   → somente leitura (GET/HEAD/OPTIONS)
    DISCENTE  → leitura + inserção + edição (sem DELETE)
    DOCENTE   → leitura + inserção + edição + exclusão (restrito à unidade via BaseTenantViewSet)
    ADMIN     → acesso total
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', 'AUDITOR')

        if request.method in SAFE_METHODS:
            return True

        if role == 'AUDITOR':
            return False

        if request.method == 'DELETE':
            return role in ['ADMIN', 'DOCENTE']

        return True  # ADMIN, DOCENTE, DISCENTE podem POST/PATCH/PUT


class CanViewAuditoria(BasePermission):
    """
    Acesso aos logs de auditoria restrito a Auditores e Administradores.
    O Auditor tem acesso somente leitura a todos os dados (F12).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'role', None) in ['AUDITOR', 'ADMIN']
