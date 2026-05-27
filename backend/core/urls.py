from django.urls import path, include
from .views import MinhasUnidadesView, health_check

urlpatterns = [
    path('health-check/', health_check, name='health-check'),
    path('minhas-unidades/', MinhasUnidadesView.as_view(), name='minhas-unidades'),
    path('accounts/', include('accounts.urls')),
    path('agronomia/', include('agronomia.urls')),
    path('caderno/', include('caderno.urls')),
]
