from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Cultura, Talhao, CicloCultivo
from .serializers import CulturaSerializer, TalhaoSerializer, CicloCultivoSerializer

class CulturaViewSet(viewsets.ModelViewSet):
    """API para gerir o catálogo de Culturas"""
    queryset = Cultura.objects.all()
    serializer_class = CulturaSerializer
    permission_classes = [IsAuthenticated] # Apenas utilizadores com login podem aceder

class TalhaoViewSet(viewsets.ModelViewSet):
    """API para gerir as Unidades Produtivas"""
    queryset = Talhao.objects.all()
    serializer_class = TalhaoSerializer
    permission_classes = [IsAuthenticated]

class CicloCultivoViewSet(viewsets.ModelViewSet):
    """API para gerir os Ciclos de Cultivo (Onde e O Quê)"""
    queryset = CicloCultivo.objects.all()
    serializer_class = CicloCultivoSerializer
    permission_classes = [IsAuthenticated]