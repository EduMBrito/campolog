from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, TodosUsuariosView

router = DefaultRouter()
router.register(r'usuarios-unidade', UserViewSet, basename='usuarios-unidade')

urlpatterns = [
    path('', include(router.urls)),
    path('todos-usuarios/', TodosUsuariosView.as_view(), name='todos-usuarios'),
]
