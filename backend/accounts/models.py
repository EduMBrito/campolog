from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Definindo as opções do campo 'role' (Papel)
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        DOCENTE = 'DOCENTE', 'Docente'
        DISCENTE = 'DISCENTE', 'Discente'
        AUDITOR = 'AUDITOR', 'Auditor'

    # Adicionando o campo customizado
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.DISCENTE, # Discente como padrão por segurança
        verbose_name='Papel do Usuário'
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"