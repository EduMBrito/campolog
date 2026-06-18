from rest_framework import serializers

from .models import LogAuditoria


class LogAuditoriaSerializer(serializers.ModelSerializer):
    acao_display = serializers.CharField(source='get_acao_display', read_only=True)
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True, default=None)

    class Meta:
        model = LogAuditoria
        fields = [
            'id', 'usuario', 'usuario_nome', 'acao', 'acao_display',
            'entidade', 'entidade_id', 'dados_anteriores', 'dados_novos',
            'unidade', 'unidade_nome', 'timestamp',
        ]
