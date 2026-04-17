from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .serializers import UserSerializer, CustomTokenObtainPairSerializer
from .permissions import IsAdmin

User = get_user_model()

# 1. View de Login Customizada
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# 2. ViewSet de Usuários
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin] # Por padrão, apenas Admin faz CRUD de usuários
    
    # Rota: GET /api/accounts/users/me/
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Retorna os dados do usuário atualmente logado, independentemente do papel."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)