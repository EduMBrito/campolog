from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# Sempre usamos get_user_model() em vez de importar a classe diretamente
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        # Protege a senha: ela pode ser enviada para criação, mas nunca lida na resposta (GET)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'DISCENTE') # Discente como fallback de segurança
        )
        user.set_password(validated_data['password']) # Criptografa a senha
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adicionando nossos dados customizados no payload do token
        token['username'] = user.username
        token['role'] = user.role
        
        return token