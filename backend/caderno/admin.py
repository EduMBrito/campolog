from django.contrib import admin
from .models import RegistoCampo

@admin.register(RegistoCampo)
class RegistoCampoAdmin(admin.ModelAdmin):
    list_display = ('ciclo', 'tipo', 'autor', 'data_registo', 'quantidade')
    list_filter = ('tipo', 'data_registo', 'ciclo__talhao')
    search_fields = ('descricao', 'autor__username', 'ciclo__cultura__nome')