from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CulturaViewSet, TalhaoViewSet, CicloCultivoViewSet, DashboardStatsView

router = DefaultRouter()
router.register(r'culturas', CulturaViewSet, basename='cultura')
router.register(r'talhoes', TalhaoViewSet, basename='talhao')
router.register(r'ciclos', CicloCultivoViewSet, basename='ciclo')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
