from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'is_superuser']
        extra_kwargs = {'password': {'write_only': True}} # A senha não volta no GET

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            role=validated_data.get('role', 'DISCENTE')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    # ----- MÉTODO ATUALIZADO AQUI -----
    def update(self, instance, validated_data):
        # Se houver senha no envio, usamos set_password para criptografar
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        # Atualiza os demais campos (role, email, etc)
        return super().update(instance, validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # 1. Executa a validação padrão (que gera o access token e o refresh token)
        data = super().validate(attrs)

        # 2. INJEÇÃO DE DADOS: Colocamos o objeto 'user' dentro da resposta
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            # Pegamos o role. Se por algum motivo o campo vier vazio, mandamos 'DISCENTE'
            'role': getattr(self.user, 'role', 'DISCENTE'), 
            'is_superuser': self.user.is_superuser
        }

        return data