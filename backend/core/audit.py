import json

from .models import LogAuditoria


def serializar_instancia(instance, serializer_class):
    """Serializa uma instância em dict JSON-safe para guardar no log de auditoria."""
    try:
        data = serializer_class(instance).data
        # Garante que o resultado é 100% JSON serializável (datas, Decimals, etc.)
        return json.loads(json.dumps(data, default=str))
    except Exception:
        # Em último caso, regista apenas a representação textual do objeto
        return {"repr": str(instance)}


class AuditMixin:
    """
    Mixin para ViewSets DRF que regista automaticamente as operações de escrita
    (CRIAR / ATUALIZAR / EXCLUIR) na tabela LogAuditoria.

    Captura o utilizador autenticado, a unidade produtiva ativa (header
    X-Unidade-ID) e um instantâneo dos dados antes/depois da alteração.

    ViewSets que sobrescrevem perform_create/update/destroy (ex.: para injetar
    autor ou validar permissões) devem chamar `self.registrar_log(...)`
    diretamente — ver RegistoCampoViewSet e UnidadeViewSet.
    """

    def snapshot(self, instance):
        return serializar_instancia(instance, self.get_serializer_class())

    def registrar_log(self, acao, instance, dados_anteriores=None, dados_novos=None):
        user = getattr(self.request, 'user', None)
        if user is not None and not user.is_authenticated:
            user = None

        unidade_id = self.request.META.get('HTTP_X_UNIDADE_ID')
        if unidade_id:
            unidade_id = str(unidade_id).strip().strip('"').strip("'")
            unidade_id = unidade_id if unidade_id.isdigit() else None
        else:
            unidade_id = None

        LogAuditoria.objects.create(
            usuario=user,
            usuario_nome=getattr(user, 'username', '') or '',
            acao=acao,
            entidade=instance.__class__.__name__,
            entidade_id=str(instance.pk) if instance.pk is not None else None,
            dados_anteriores=dados_anteriores,
            dados_novos=dados_novos,
            unidade_id=unidade_id,
        )

    def perform_create(self, serializer):
        super().perform_create(serializer)
        self.registrar_log(
            LogAuditoria.Acao.CRIAR,
            serializer.instance,
            dados_novos=self.snapshot(serializer.instance),
        )

    def perform_update(self, serializer):
        # Captura o estado anterior antes do serializer.save() aplicar as mudanças
        anteriores = self.snapshot(serializer.instance)
        super().perform_update(serializer)
        self.registrar_log(
            LogAuditoria.Acao.ATUALIZAR,
            serializer.instance,
            dados_anteriores=anteriores,
            dados_novos=self.snapshot(serializer.instance),
        )

    def perform_destroy(self, instance):
        # Captura antes de excluir (a pk é anulada após o delete)
        anteriores = self.snapshot(instance)
        self.registrar_log(
            LogAuditoria.Acao.EXCLUIR,
            instance,
            dados_anteriores=anteriores,
        )
        super().perform_destroy(instance)
