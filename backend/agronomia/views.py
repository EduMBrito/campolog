from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Cultura, Talhao, CicloCultivo
from .serializers import CulturaSerializer, TalhaoSerializer, CicloCultivoSerializer
from caderno.models import RegistoCampo, UnidadeProdutiva
from caderno.serializers import RegistoCampoSerializer
from core.views import BaseTenantViewSet
from core.permissions import RoleBasedPermission
from core.audit import AuditMixin


class CulturaViewSet(AuditMixin, viewsets.ModelViewSet):
    queryset = Cultura.objects.all()
    serializer_class = CulturaSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class TalhaoViewSet(AuditMixin, BaseTenantViewSet):
    queryset = Talhao.objects.all()
    serializer_class = TalhaoSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class CicloCultivoViewSet(AuditMixin, BaseTenantViewSet):
    queryset = CicloCultivo.objects.all()
    serializer_class = CicloCultivoSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unidade_id = request.META.get('HTTP_X_UNIDADE_ID', '').strip().replace('"', '').replace("'", "")
        if not unidade_id:
            return Response({'erro': 'Unidade produtiva ativa não identificada no cabeçalho.'}, status=400)

        unidade_obj = UnidadeProdutiva.objects.filter(id=unidade_id).first() if unidade_id.isdigit() else None
        unidade_nome = unidade_obj.nome if unidade_obj else f"Unidade #{unidade_id}"

        ultimos_registros = RegistoCampo.objects.filter(unidade_id=unidade_id).order_by('-id')[:5]

        return Response({
            'unidade_nome': unidade_nome,
            'total_talhoes': Talhao.objects.filter(unidade_id=unidade_id).count(),
            'culturas_cadastradas': Cultura.objects.count(),
            'ciclos_ativos': CicloCultivo.objects.filter(unidade_id=unidade_id, status='ATIVO').count(),
            'total_diario': RegistoCampo.objects.filter(unidade_id=unidade_id).count(),
            'ultimas_atividades': RegistoCampoSerializer(ultimos_registros, many=True).data,
        })
