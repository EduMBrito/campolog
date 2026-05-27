from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from caderno.models import UnidadeProdutiva




@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Endpoint de verificação de saúde da API."""
    return Response({
        "status": "ok",
        "projeto": "CampoLog",
        "versao": "0.1.0",
    })
class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Classe base multi-tenant. Filtra as consultas automáticas e 
    injeta o ID da Unidade Produtiva na criação dos registos.
    """
    def get_queryset(self):
        # Captura o crachá enviado pelo React nos headers HTTP
        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if not unidade_id:
            return self.queryset.none()  # Segurança: não enviou, não recebe nada
        return self.queryset.filter(unidade_id=unidade_id)

    def perform_create(self, serializer):
        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if not unidade_id:
            raise ValidationError({"detail": "Nenhuma unidade produtiva ativa informada."})
        # Salva o modelo injetando automaticamente a unidade correta
        serializer.save(unidade_id=unidade_id)

class MinhasUnidadesView(APIView):
    """Devolve apenas as unidades que o utilizador logado tem acesso"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Filtra as unidades onde o 'usuarios' contém o utilizador logado
        unidades = UnidadeProdutiva.objects.filter(usuarios=request.user, ativo=True)
        
        # Formata a resposta manualmente (assim não precisamos criar um Serializer só para isto)
        dados = [{"id": u.id, "nome": u.nome} for u in unidades]
        
        return Response(dados)