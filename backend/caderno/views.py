from rest_framework import viewsets
from rest_framework.decorators import action # Para criar rotas customizadas
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny # AllowAny será usado para o QR Code
from .models import RegistoCampo
from agronomia.models import CicloCultivo
from .serializers import RegistoCampoSerializer, RelatorioCicloSerializer

class RegistoCampoViewSet(viewsets.ModelViewSet):
    """API para gerir os registos diários do Caderno de Campo"""
    queryset = RegistoCampo.objects.all()
    serializer_class = RegistoCampoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(autor=self.request.user)

class RelatorioViewSet(viewsets.ReadOnlyModelViewSet):
    """API exclusiva para leitura de relatórios e dossiês de rastreabilidade"""
    queryset = CicloCultivo.objects.all()
    serializer_class = RelatorioCicloSerializer
    
    # IMPORTANTE: Já estamos preparando a rota para ser pública (para o futuro QR Code)
    permission_classes = [AllowAny]