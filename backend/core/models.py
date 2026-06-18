from django.db import models
from django.conf import settings


class LogAuditoria(models.Model):
    """
    Registo imutável das operações de escrita no sistema (F12 — Auditoria).

    Cada criação, atualização ou exclusão feita através da API gera uma linha
    aqui, com o utilizador responsável, a unidade produtiva ativa e um
    instantâneo (snapshot) dos dados antes e depois da alteração.
    """

    class Acao(models.TextChoices):
        CRIAR = 'CRIAR', 'Criação'
        ATUALIZAR = 'ATUALIZAR', 'Atualização'
        EXCLUIR = 'EXCLUIR', 'Exclusão'

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='logs_auditoria',
    )
    usuario_nome = models.CharField(
        max_length=150, blank=True,
        help_text="Snapshot do nome do utilizador no momento da ação.",
    )
    acao = models.CharField(max_length=20, choices=Acao.choices)
    entidade = models.CharField(max_length=100, help_text="Nome do model afetado, ex.: RegistoCampo")
    entidade_id = models.CharField(max_length=50, null=True, blank=True)
    dados_anteriores = models.JSONField(null=True, blank=True)
    dados_novos = models.JSONField(null=True, blank=True)
    unidade = models.ForeignKey(
        'caderno.UnidadeProdutiva',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='logs_auditoria',
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Log de Auditoria'
        verbose_name_plural = 'Logs de Auditoria'

    def __str__(self):
        return f"[{self.timestamp:%d/%m/%Y %H:%M}] {self.usuario_nome} {self.acao} {self.entidade}#{self.entidade_id}"
