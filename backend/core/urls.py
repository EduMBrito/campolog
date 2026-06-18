from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import MinhasUnidadesView, health_check, LogAuditoriaViewSet

router = DefaultRouter()
router.register(r'auditoria/logs', LogAuditoriaViewSet, basename='auditoria-log')

urlpatterns = [
    path('health-check/', health_check, name='health-check'),
    path('minhas-unidades/', MinhasUnidadesView.as_view(), name='minhas-unidades'),
    path('accounts/', include('accounts.urls')),
    path('agronomia/', include('agronomia.urls')),
    path('caderno/', include('caderno.urls')),
    path('', include(router.urls)),
]
