from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import RegistoCampo
from .serializers import RegistoCampoSerializer

class RegistoCampoViewSet(viewsets.ModelViewSet):
    """API para gerir os registos diários do Caderno de Campo"""
    queryset = RegistoCampo.objects.all()
    serializer_class = RegistoCampoSerializer
    permission_classes = [IsAuthenticated] # Apenas utilizadores com login

    def perform_create(self, serializer):
        # A magia acontece aqui: guardamos o registo forçando o autor 
        # a ser o utilizador que fez o pedido (request.user)
        serializer.save(autor=self.request.user)