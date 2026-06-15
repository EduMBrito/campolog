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
