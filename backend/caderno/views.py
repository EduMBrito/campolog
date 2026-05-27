from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.contrib.auth import get_user_model
from .models import RegistoCampo, UnidadeProdutiva
from agronomia.models import CicloCultivo
from .serializers import RegistoCampoSerializer, RelatorioCicloSerializer, UnidadeSerializer
from core.views import BaseTenantViewSet

User = get_user_model() 

class RegistoCampoViewSet(BaseTenantViewSet): # MUDOU AQUI (Herdando do tenant)
    """API para gerir os registos diários do Caderno de Campo"""
    queryset = RegistoCampo.objects.all()
    serializer_class = RegistoCampoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if not unidade_id:
            raise ValidationError({"detail": "Nenhuma unidade produtiva ativa informada."})
        
        # Salva injetando o AUTOR e a UNIDADE ao mesmo tempo!
        serializer.save(autor=self.request.user, unidade_id=unidade_id)

class UnidadeViewSet(viewsets.ModelViewSet):
    """CRUD de Unidades Produtivas com gestão de usuários vinculados."""
    serializer_class = UnidadeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self.request.user, 'role', None) == 'ADMIN':
            return UnidadeProdutiva.objects.all()
        return UnidadeProdutiva.objects.filter(usuarios=self.request.user)

    def check_admin(self):
        if getattr(self.request.user, 'role', None) != 'ADMIN':
            raise PermissionDenied("Apenas administradores podem gerir unidades produtivas.")

    def perform_create(self, serializer):
        self.check_admin()
        serializer.save()

    def perform_update(self, serializer):
        self.check_admin()
        serializer.save()

    def perform_destroy(self, instance):
        self.check_admin()
        instance.delete()

    @action(detail=True, methods=['post'], url_path='adicionar-usuario')
    def adicionar_usuario(self, request, pk=None):
        self.check_admin()
        unidade = self.get_object()
        usuario_id = request.data.get('usuario_id')
        try:
            user = User.objects.get(id=usuario_id)
            unidade.usuarios.add(user)
            return Response({'detail': f'Usuário {user.username} adicionado com sucesso.'})
        except User.DoesNotExist:
            return Response({'detail': 'Usuário não encontrado.'}, status=404)

    @action(detail=True, methods=['post'], url_path='remover-usuario')
    def remover_usuario(self, request, pk=None):
        self.check_admin()
        unidade = self.get_object()
        usuario_id = request.data.get('usuario_id')
        try:
            user = User.objects.get(id=usuario_id)
            unidade.usuarios.remove(user)
            return Response({'detail': f'Usuário {user.username} removido com sucesso.'})
        except User.DoesNotExist:
            return Response({'detail': 'Usuário não encontrado.'}, status=404)


class RelatorioViewSet(viewsets.ReadOnlyModelViewSet):
    """API exclusiva para leitura de relatórios e dossiês de rastreabilidade (Público via QR Code)"""
    queryset = CicloCultivo.objects.all()
    serializer_class = RelatorioCicloSerializer
    permission_classes = [AllowAny]
    
    # Nota: Este não herda do BaseTenantViewSet porque o leitor do QR Code 
    # não envia headers HTTP_X_UNIDADE_ID (ele acessa de fora do sistema).
    # O próprio Serializer ou ID da URL já isolará o relatório daquele ciclo específico.