from django.contrib import admin

from .models import LogAuditoria


@admin.register(LogAuditoria)
class LogAuditoriaAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'usuario_nome', 'acao', 'entidade', 'entidade_id', 'unidade')
    list_filter = ('acao', 'entidade', 'timestamp')
    search_fields = ('usuario_nome', 'entidade', 'entidade_id')
    readonly_fields = [f.name for f in LogAuditoria._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
