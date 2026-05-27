from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from caderno.models import UnidadeProdutiva

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    View customizada que intercepta o login do JWT e força
    o uso do nosso serializer para injetar o ID e o Papel (role).
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    """
    API para gerir os usuários vinculados à Unidade Produtiva ativa.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if not unidade_id:
            return User.objects.none()
        
        try:
            # Busca a unidade pelo cabeçalho
            unidade = UnidadeProdutiva.objects.get(id=unidade_id)
            # Retorna diretamente os usuários dela
            return unidade.usuarios.all()
        except UnidadeProdutiva.DoesNotExist:
            return User.objects.none()

    def perform_create(self, serializer):
        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if not unidade_id:
            raise ValidationError({"detail": "Nenhuma unidade produtiva ativa informada no cabeçalho."})
        
        # 1. Salva o usuário (criptografando a senha via serializer)
        novo_usuario = serializer.save()
        
        # 2. Vincula o usuário recém-criado à Unidade Produtiva ativa automaticamente
        try:
            unidade = UnidadeProdutiva.objects.get(id=unidade_id)
            unidade.usuarios.add(novo_usuario)
        except UnidadeProdutiva.DoesNotExist:
            raise ValidationError({"detail": "A unidade produtiva informada não existe."})


class TodosUsuariosView(APIView):
    """Lista todos os usuários do sistema — exclusivo para ADMIN."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', None) != 'ADMIN':
            raise PermissionDenied("Acesso restrito a administradores.")
        users = User.objects.all().values('id', 'username', 'email', 'role')
        return Response(list(users))