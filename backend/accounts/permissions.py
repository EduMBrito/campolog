from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Permite acesso apenas a usuários com o papel de Administrador."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsDocente(permissions.BasePermission):
    """Permite acesso apenas a Docentes."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCENTE')

class IsDocenteOrAdmin(permissions.BasePermission):
    """Permite acesso a Docentes ou Administradores."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            request.user.role in ['ADMIN', 'DOCENTE']
        )

class IsAuditor(permissions.BasePermission):
    """Permite acesso apenas a Auditores (normalmente apenas leitura)."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'AUDITOR')