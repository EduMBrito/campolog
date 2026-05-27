from django.contrib import admin
from .models import RegistoCampo
from .models import UnidadeProdutiva

@admin.register(RegistoCampo)
class RegistoCampoAdmin(admin.ModelAdmin):
    list_display = ('ciclo', 'tipo', 'autor', 'data_registo', 'quantidade')
    list_filter = ('tipo', 'data_registo', 'ciclo__talhao')
    search_fields = ('descricao', 'autor__username', 'ciclo__cultura__nome')
    
@admin.register(UnidadeProdutiva)
class UnidadeProdutivaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'cidade', 'ativo', 'criado_em')
    filter_horizontal = ('usuarios',) # Cria aquela interface bonita de "duas caixas" para adicionar utilizadores