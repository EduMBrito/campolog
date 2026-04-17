from rest_framework import serializers
from .models import Cultura, Talhao, CicloCultivo

class CulturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cultura
        fields = '__all__'

class TalhaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Talhao
        fields = '__all__'

class CicloCultivoSerializer(serializers.ModelSerializer):
    # Adicionamos estes campos apenas de leitura para que o React receba os nomes 
    # e não apenas os IDs (ex: em vez de receber apenas "talhao: 1", recebe "talhao_nome: Setor A")
    cultura_nome = serializers.CharField(source='cultura.nome', read_only=True)
    talhao_nome = serializers.CharField(source='talhao.nome', read_only=True)

    class Meta:
        model = CicloCultivo
        fields = '__all__'