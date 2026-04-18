from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegistoCampoViewSet

# O DefaultRouter cria automaticamente as rotas GET, POST, PUT e DELETE
router = DefaultRouter()
router.register(r'diario', RegistoCampoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]