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
        read_only_fields = ['unidade']


class CicloCultivoSerializer(serializers.ModelSerializer):
    cultura_nome = serializers.CharField(source='cultura.nome', read_only=True)
    cultura_variedade = serializers.CharField(source='cultura.variedade', read_only=True, default='')
    talhao_nome = serializers.CharField(source='talhao.nome', read_only=True)
    unidade_nome = serializers.CharField(source='unidade.nome', read_only=True)

    class Meta:
        model = CicloCultivo
        fields = '__all__'
        read_only_fields = ['unidade']
