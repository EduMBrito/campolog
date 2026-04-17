from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CulturaViewSet, TalhaoViewSet, CicloCultivoViewSet

# O DefaultRouter cria automaticamente as rotas para GET, POST, PUT e DELETE
router = DefaultRouter()
router.register(r'culturas', CulturaViewSet)
router.register(r'talhoes', TalhaoViewSet)
router.register(r'ciclos', CicloCultivoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]