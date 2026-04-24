from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistoCampoViewSet, RelatorioViewSet
    

# O DefaultRouter cria automaticamente as rotas GET, POST, PUT e DELETE
router = DefaultRouter()
router.register(r'diario', RegistoCampoViewSet)
router.register(r'relatorios/ciclo', RelatorioViewSet, basename='relatorio-ciclo')

urlpatterns = [
    path('', include(router.urls)),
]