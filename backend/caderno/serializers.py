from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import RegistoCampo, UnidadeProdutiva
from agronomia.models import CicloCultivo

User = get_user_model()


class UsuarioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class UnidadeSerializer(serializers.ModelSerializer):
    usuarios = UsuarioListSerializer(many=True, read_only=True)
    total_usuarios = serializers.SerializerMethodField()

    class Meta:
        model = UnidadeProdutiva
        fields = ['id', 'nome', 'cnpj_ou_codigo', 'cidade', 'ativo', 'criado_em', 'usuarios', 'total_usuarios']

    def get_total_usuarios(self, obj):
        return obj.usuarios.count()


class RegistoCampoSerializer(serializers.ModelSerializer):
    autor_nome = serializers.CharField(source='autor.username', read_only=True)
    talhao_nome = serializers.CharField(source='ciclo.talhao.nome', read_only=True)
    cultura_nome = serializers.CharField(source='ciclo.cultura.nome', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = RegistoCampo
        fields = '__all__'
        read_only_fields = ['unidade', 'autor']


class RelatorioCicloSerializer(serializers.ModelSerializer):
    cultura_nome = serializers.CharField(source='cultura.nome', read_only=True)
    talhao_nome = serializers.CharField(source='talhao.nome', read_only=True)
    area_m2 = serializers.FloatField(source='talhao.area_m2', read_only=True)
    registos = RegistoCampoSerializer(source='registos_campo', many=True, read_only=True)

    class Meta:
        model = CicloCultivo
        fields = ['id', 'cultura_nome', 'talhao_nome', 'area_m2', 'data_inicio', 'data_fim_prevista', 'status', 'registos']
