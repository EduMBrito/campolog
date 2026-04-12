from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Endpoint de verificação de saúde da API."""
    return Response({
        "status": "ok",
        "projeto": "CampoLog",
        "versao": "0.1.0",
    })
