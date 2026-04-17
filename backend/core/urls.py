from django.urls import path, include

urlpatterns = [
    # Rotas do Módulo 1 (Utilizadores)
    path('accounts/', include('accounts.urls')), 
    
    # Rotas do Módulo 2 (Talhões e Culturas)
    path('agronomia/', include('agronomia.urls')),
]