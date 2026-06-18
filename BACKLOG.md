# Backlog Técnico — CampoLog

Itens conhecidos e adiados, com contexto para retomada futura.

## M8 — Modo Offline (PWA)

### Resolução de conflitos na sincronização offline
**Status:** adiado (backlog)
**Contexto:** A fila offline (IndexedDB) hoje aplica **last-write-wins**. Se um
registro do diário for alterado no servidor enquanto alguém o edita/exclui
offline, ao reconectar o `PATCH`/`DELETE` sobrescreve a versão do servidor sem
aviso.

**Proposta de implementação:**
- **Backend:** adicionar versionamento ao `RegistoCampo` (campo `atualizado_em`
  com `auto_now`, ou um inteiro `versao`). No `RegistoCampoViewSet`, rejeitar o
  `PATCH`/`DELETE` com **HTTP 409 (Conflict)** quando a versão enviada pelo
  cliente for mais antiga que a do servidor. Requer migration.
- **Frontend:** ao enfileirar uma edição offline, guardar a versão/timestamp
  que o cliente tinha. Na sincronização, em caso de `409`, **não descartar** o
  item — sinalizar ao usuário (ex.: marcar como "conflito" e oferecer manter a
  versão local ou a do servidor).

**Arquivos envolvidos:** `backend/caderno/models.py`,
`backend/caderno/views.py`, `backend/caderno/serializers.py`,
`frontend/src/utils/offlineQueue.ts`, `frontend/src/pages/DiarioCampo.tsx`.

## M9 — Auditoria e Validação

### Fluxo de aprovação docente (N01)
**Status:** não iniciado — em avaliação de produto (não é apenas adiamento técnico)
**Contexto:** A parte de auditoria do M9 (trilha de logs — F12) está concluída
(`LogAuditoria` + endpoint `/api/auditoria/logs/` + tela `/auditoria`). Já o
fluxo de aprovação docente (status **Pendente / Aprovado / Rejeitado** nos
registros do diário) **ainda não foi fechado como requisito**: pode fazer sentido
para algumas unidades produtivas e ser desnecessário para outras. A decisão de
implementar — e se será **configurável por unidade** — depende de validação com
os usuários.

**Proposta de implementação (se confirmado):**
- **Backend:** campo `status_aprovacao` em `RegistoCampo` (default `PENDENTE`),
  endpoints/actions para o DOCENTE aprovar/rejeitar, e — caso seja opcional — um
  flag em `UnidadeProdutiva` (ex.: `exige_aprovacao`) para ativar o fluxo só nas
  unidades que quiserem. Requer migration. As transições de status já seriam
  capturadas pela `LogAuditoria` existente.
- **Frontend:** badges de status no Diário, ações de aprovar/rejeitar para o
  DOCENTE e filtro por status.

**Arquivos envolvidos:** `backend/caderno/models.py`,
`backend/caderno/views.py`, `backend/caderno/serializers.py`,
`frontend/src/pages/DiarioCampo.tsx`.

### Suíte de testes de auditoria exige permissão CREATEDB
**Status:** nota de ambiente
**Contexto:** Existe uma suíte funcional em `backend/core/tests.py` cobrindo a
trilha de auditoria. O `python manage.py test` cria um banco de teste, mas o
papel `campolog` do PostgreSQL local não tem `CREATEDB`. Para rodar a suíte:
`ALTER ROLE campolog CREATEDB;` (executado por um superusuário do PostgreSQL).
