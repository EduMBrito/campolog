from django.contrib import admin
from .models import Cultura, Talhao, CicloCultivo

@admin.register(Cultura)
class CulturaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'variedade')
    search_fields = ('nome', 'variedade')

@admin.register(Talhao)
class TalhaoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'area_m2')
    search_fields = ('nome',)

@admin.register(CicloCultivo)
class CicloCultivoAdmin(admin.ModelAdmin):
    list_display = ('cultura', 'talhao', 'data_inicio', 'status')
    list_filter = ('status', 'cultura', 'talhao')