from rest_framework import serializers
from .models import RegistoCampo
from agronomia.models import CicloCultivo # Importação necessária

class RegistoCampoSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source='autor.username', read_only=True)
    talhao_nome = serializers.CharField(source='ciclo.talhao.nome', read_only=True)
    cultura_nome = serializers.CharField(source='ciclo.cultura.nome', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = RegistoCampo
        fields = '__all__'
        read_only_fields = ('autor',)

# NOVO SERIALIZER PARA O RELATÓRIO
class RelatorioCicloSerializer(serializers.ModelSerializer):
    # Trazemos os nomes bonitos
    cultura_nome = serializers.CharField(source='cultura.nome', read_only=True)
    talhao_nome = serializers.CharField(source='talhao.nome', read_only=True)
    area_m2 = serializers.FloatField(source='talhao.area_m2', read_only=True)
    
    # A Mágica: Trazemos todos os registros vinculados a este ciclo!
    registos = RegistoCampoSerializer(source='registos_campo', many=True, read_only=True)

    class Meta:
        model = CicloCultivo
        fields = ['id', 'cultura_nome', 'talhao_nome', 'area_m2', 'data_inicio', 'data_fim_prevista', 'status', 'registos']