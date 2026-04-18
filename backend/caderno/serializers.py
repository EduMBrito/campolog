from rest_framework import serializers
from .models import RegistoCampo

class RegistoCampoSerializer(serializers.ModelSerializer):
    # Campos extra apenas de leitura para facilitar a exibição no Frontend
    autor_nome = serializers.CharField(source='autor.username', read_only=True)
    talhao_nome = serializers.CharField(source='ciclo.talhao.nome', read_only=True)
    cultura_nome = serializers.CharField(source='ciclo.cultura.nome', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = RegistoCampo
        fields = '__all__'
        # O autor será preenchido automaticamente pelo backend, por isso o frontend não precisa de o enviar
        read_only_fields = ('autor',)