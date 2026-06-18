# CampoLog — Caderno de Campo Digital

> Sistema de registro de atividades agrícolas desenvolvido para o Instituto Federal do Sertão Pernambucano.
> Transforma o caderno de campo manual em um processo digital, rastreável e acessível via navegador — inclusive offline.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Estrutura do Repositório](#estrutura-do-repositório)
- [Setup de Desenvolvimento](#setup-de-desenvolvimento)
- [Deploy com Docker](#deploy-com-docker)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [API — Referência Rápida](#api--referência-rápida)
- [Perfis e Permissões](#perfis-e-permissões)
- [Modelo de Dados](#modelo-de-dados)
- [Status dos Módulos](#status-dos-módulos)
- [Convenções de Desenvolvimento](#convenções-de-desenvolvimento)

---

## Visão Geral

O CampoLog digitaliza o registro de atividades agrícolas em três pilares:

1. **Rastreabilidade** — do plantio à colheita, com rastreabilidade por QR Code
2. **Ensino e pesquisa** — lançamentos por discentes com validação docente
3. **Conformidade com BPA** — aderência às normas de Boas Práticas Agrícolas

O sistema é **multi-tenant**: cada unidade produtiva (campo/campus) mantém seus dados isolados, com usuários podendo pertencer a múltiplas unidades.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Backend | Python + Django + DRF | 3.12 / 5.1.7 / 3.15.2 |
| Autenticação | djangorestframework-simplejwt | 5.5.0 |
| Banco de dados | PostgreSQL + PostGIS | 16 / 3.4 |
| Frontend | React + TypeScript | 18.3 / 5.7 |
| Build tool | Vite + Vite PWA Plugin | 6.3 / 1.2 |
| HTTP client | Axios | 1.15 |
| PDF/QR | jsPDF + html2canvas + react-qrcode | — |
| Servidor prod. | Nginx + Gunicorn | alpine / latest |
| Containerização | Docker + Docker Compose | — |

---

## Arquitetura

Padrão **cliente-servidor com API REST**. O frontend React opera de forma independente (modo offline via IndexedDB) e consome a mesma API que futuras integrações poderão usar.

```
┌──────────────────────────────────────────┐
│          CAMADA DE APRESENTAÇÃO          │
│   React 18 + TypeScript | PWA | Mobile   │
└─────────────────┬────────────────────────┘
                  │  REST JSON + JWT
                  │  Header: X-Unidade-ID
┌─────────────────▼────────────────────────┐
│           CAMADA DE NEGÓCIO              │
│   Django 5 + DRF | JWT | RolePermission  │
│                                          │
│   ┌──────────┐ ┌──────────┐ ┌────────┐  │
│   │ accounts │ │agronomia │ │caderno │  │
│   └──────────┘ └──────────┘ └────────┘  │
└─────────────────┬────────────────────────┘
                  │  Django ORM
┌─────────────────▼────────────────────────┐
│             CAMADA DE DADOS              │
│   PostgreSQL 16 + PostGIS | Filesystem   │
└──────────────────────────────────────────┘
```

### Multi-tenant

O isolamento de dados por unidade produtiva é feito via **header HTTP `X-Unidade-ID`**:

- O frontend injeta o header em toda requisição autenticada (interceptor Axios)
- `BaseTenantViewSet` (backend) filtra `queryset` e injeta `unidade` no `perform_create()`
- Entidades globais (ex: catálogo de culturas) não são filtradas por unidade

---

## Estrutura do Repositório

```
campoLog-dev/
├── backend/
│   ├── config/               # Settings, URLs raiz, WSGI
│   ├── core/                 # BaseTenantViewSet, RoleBasedPermission, health check
│   ├── accounts/             # Usuários, JWT customizado, gestão por unidade
│   ├── agronomia/            # Culturas, Talhões, Ciclos de Cultivo, Dashboard
│   ├── caderno/              # Diário de campo, Unidades Produtivas, Relatórios
│   ├── media/                # Uploads (fotos/vídeos) — excluído do git
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                  # Não versionado
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # 14 páginas (Login, Dashboard, Talhões, Diário...)
│   │   ├── components/       # ProtectedRoute e componentes reutilizáveis
│   │   ├── contexts/         # AuthContext (token + unidadeAtiva)
│   │   ├── hooks/            # usePermissoes (RBAC no frontend)
│   │   ├── services/         # api.ts, agronomiaService, cadernoService, userService
│   │   ├── utils/            # offlineQueue (IndexedDB + sync PWA)
│   │   ├── App.tsx           # Roteamento principal
│   │   └── main.tsx
│   ├── public/
│   ├── vite.config.ts        # Vite + PWA plugin
│   ├── package.json
│   └── .env.example
│
├── docker/
│   ├── backend.Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── CLAUDE.md                 # Documentação técnica extendida
└── README.md
```

---

## Setup de Desenvolvimento

### Pré-requisitos

- Python 3.12+
- Node.js 20 LTS
- PostgreSQL 16 com extensão PostGIS instalada
- Git

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # Ajuste as variáveis conforme necessário

python manage.py migrate
python manage.py createsuperuser  # Cria admin inicial
python manage.py runserver        # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

cp .env.example .env              # Ajuste VITE_API_URL se necessário

npm run dev                       # http://localhost:5173
```

> **CORS:** Em desenvolvimento, o backend já aceita `http://localhost:5173` por padrão via `CORS_ALLOWED_ORIGINS`.

### Primeiro uso

1. Acesse `http://localhost:5173` e faça login com o superusuário criado
2. Acesse `http://localhost:8000/admin` para criar unidades produtivas e associar usuários
3. No frontend, selecione a unidade ativa ao fazer login

---

## Deploy com Docker

```bash
# Sobe os 3 containers: backend (Gunicorn), db (PostgreSQL+PostGIS), nginx
docker compose up --build -d

# Aplicar migrations
docker compose exec backend python manage.py migrate

# Criar superusuário
docker compose exec backend python manage.py createsuperuser
```

Acesse em `http://localhost` (porta 80).

### Containers

| Container | Imagem | Porta | Responsabilidade |
|-----------|--------|-------|-----------------|
| `backend` | `python:3.12-slim` | 8000 (interno) | Django + Gunicorn (3 workers) |
| `db` | `postgis/postgis:16-3.4` | 5432 (interno) | PostgreSQL + PostGIS |
| `nginx` | `nginx:alpine` | **80** | Serve frontend estático + proxy `/api/` → backend |

O Nginx serve o build React em `/` (com fallback para `index.html` para SPA) e faz proxy reverso de `/api/` e `/admin/` para o backend. Limite de upload: **20 MB** (configurável em `nginx.conf`).

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SECRET_KEY` | `django-insecure-...` | Chave secreta Django — **troque em produção** |
| `DEBUG` | `True` | Modo debug |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hosts permitidos (separados por vírgula) |
| `DB_NAME` | `campolog_db` | Nome do banco PostgreSQL |
| `DB_USER` | `campolog` | Usuário do banco |
| `DB_PASSWORD` | `campolog123` | Senha do banco — **troque em produção** |
| `DB_HOST` | `localhost` | Host do banco (`db` no Docker) |
| `DB_PORT` | `5432` | Porta do banco |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,...` | Origens permitidas para CORS |

### Frontend (`frontend/.env`)

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `VITE_API_URL` | `http://localhost:8000/api/` | URL base da API Django |

---

## API — Referência Rápida

Todas as rotas (exceto `/api/token/` e `/api/caderno/relatorios/`) requerem autenticação JWT.

**Autenticação:**
```
Authorization: Bearer <access_token>
X-Unidade-ID: <id_da_unidade_ativa>   # Obrigatório em rotas multi-tenant
```

**Tokens:**
- Access: 60 minutos
- Refresh: 7 dias (com rotação)

### Endpoints

| Método | Rota | Descrição | Acesso mínimo |
|--------|------|-----------|---------------|
| `POST` | `/api/token/` | Login — retorna `access`, `refresh`, `user{id,username,role}` | Público |
| `POST` | `/api/token/refresh/` | Renovar access token | Público |
| `GET` | `/api/health-check/` | Status da API | Público |
| `GET` | `/api/minhas-unidades/` | Unidades do usuário logado | Autenticado |
| **Usuários** | | | |
| `GET/POST` | `/api/accounts/usuarios-unidade/` | Usuários da unidade ativa | DOCENTE |
| `PATCH/DELETE` | `/api/accounts/usuarios-unidade/{id}/` | Editar/remover usuário | DOCENTE |
| `GET` | `/api/accounts/todos-usuarios/` | Todos os usuários do sistema | ADMIN |
| **Agronomia** | | | |
| `GET/POST` | `/api/agronomia/culturas/` | Catálogo global de culturas | Autenticado |
| `PATCH/DELETE` | `/api/agronomia/culturas/{id}/` | Editar/remover cultura | DOCENTE |
| `GET/POST` | `/api/agronomia/talhoes/` | Talhões da unidade ativa | Autenticado |
| `PATCH/DELETE` | `/api/agronomia/talhoes/{id}/` | Editar/remover talhão | DOCENTE |
| `GET/POST` | `/api/agronomia/ciclos/` | Ciclos de cultivo da unidade | Autenticado |
| `PATCH/DELETE` | `/api/agronomia/ciclos/{id}/` | Editar/remover ciclo | DOCENTE |
| `GET` | `/api/agronomia/dashboard-stats/` | Métricas do dashboard | Autenticado |
| **Caderno** | | | |
| `GET/POST` | `/api/caderno/diario/` | Registros do diário de campo | Autenticado |
| `PUT/DELETE` | `/api/caderno/diario/{id}/` | Editar/remover registro | DOCENTE |
| `GET/POST` | `/api/caderno/unidades/` | Gestão de unidades produtivas | ADMIN |
| `POST` | `/api/caderno/unidades/{id}/adicionar-usuario/` | Vincular usuário à unidade | ADMIN |
| `POST` | `/api/caderno/unidades/{id}/remover-usuario/` | Desvincular usuário | ADMIN |
| `GET` | `/api/caderno/relatorios/ciclo/{id}/` | Relatório público de rastreabilidade | Público |
| **Auditoria** | | | |
| `GET` | `/api/auditoria/logs/` | Trilha de auditoria (somente leitura) | AUDITOR / ADMIN |

> **Trilha de auditoria:** toda criação, edição ou exclusão feita pela API é
> registrada automaticamente em `LogAuditoria` (usuário, ação, entidade,
> snapshot antes/depois, unidade e timestamp). O endpoint aceita os filtros
> `?search=`, `?acao=CRIAR|ATUALIZAR|EXCLUIR`, `?entidade=` e `?ordering=`.
> O ADMIN visualiza os logs de todas as unidades; o AUDITOR, apenas os da
> unidade ativa.

### Exemplo de login

```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "senha123"}'

# Resposta:
# {
#   "access": "eyJ...",
#   "refresh": "eyJ...",
#   "user": { "id": 1, "username": "admin", "role": "ADMIN" }
# }
```

### Criando um registro no diário (multipart)

```bash
curl -X POST http://localhost:8000/api/caderno/diario/ \
  -H "Authorization: Bearer <token>" \
  -H "X-Unidade-ID: 1" \
  -F "ciclo=3" \
  -F "tipo=REGA" \
  -F "descricao=Irrigação por gotejamento" \
  -F "quantidade=200" \
  -F "anexo=@foto.jpg"
```

---

## Perfis e Permissões

| Perfil | Leitura | Inserção | Edição | Exclusão | Obs. |
|--------|---------|----------|--------|----------|------|
| **ADMIN** | Sim | Sim | Sim | Sim | Gestão de unidades e usuários |
| **DOCENTE** | Sim | Sim | Sim | Sim | Escopo da sua unidade |
| **DISCENTE** | Sim | Sim | Sim | Não | Sem exclusão |
| **AUDITOR** | Sim | Não | Não | Não | Somente leitura + trilha de auditoria |

Permissões são verificadas no backend via `RoleBasedPermission` (`core/permissions.py`). O frontend reflete o mesmo controle via hook `usePermissoes()`.

O acesso à trilha de auditoria (`/api/auditoria/logs/` e a tela `/auditoria`) é restrito a **AUDITOR** e **ADMIN** via `CanViewAuditoria` (`core/permissions.py`).

---

## Modelo de Dados

```
User
  ├─ role: ADMIN | DOCENTE | DISCENTE | AUDITOR

UnidadeProdutiva
  ├─ nome, cnpj_ou_codigo, cidade, ativo
  └─ usuarios: M2M → User

Cultura  (catálogo global)
  └─ nome, variedade

Talhao
  ├─ unidade: FK → UnidadeProdutiva
  └─ nome, area_m2, coordenadas

CicloCultivo
  ├─ unidade: FK → UnidadeProdutiva
  ├─ talhao: FK → Talhao
  ├─ cultura: FK → Cultura
  ├─ data_inicio, data_fim_prevista
  └─ status: PLANEJADO | ATIVO | COLHIDO | CANCELADO

RegistoCampo  (diário de campo)
  ├─ unidade: FK → UnidadeProdutiva
  ├─ ciclo: FK → CicloCultivo
  ├─ autor: FK → User
  ├─ data_registo (auto)
  ├─ tipo: REGA | INSUMO | OBSERVACAO | COLHEITA | OUTRO
  ├─ descricao, quantidade
  └─ anexo (foto/vídeo — filesystem)

LogAuditoria  (trilha de auditoria — registrada automaticamente)
  ├─ usuario: FK → User (+ usuario_nome: snapshot)
  ├─ unidade: FK → UnidadeProdutiva
  ├─ acao: CRIAR | ATUALIZAR | EXCLUIR
  ├─ entidade, entidade_id
  ├─ dados_anteriores, dados_novos (JSON — snapshot antes/depois)
  └─ timestamp (auto)
```

Arquivos de mídia são salvos em `backend/media/` (organizado por data) e servidos pelo Nginx em `/media/`.

---

## Status dos Módulos

| Cód. | Módulo | Status |
|------|--------|--------|
| M0 | Fundação (repo, Docker, CI) | Completo |
| M1 | Autenticação e Perfis JWT | Completo |
| M2 | Talhões, Culturas e Ciclos | Completo |
| M3 | Registro de Intervenções (diário) | Completo |
| M4 | Upload de Evidências (fotos/vídeos) | Completo |
| M5 | Observações e Monitoramento Fenológico | Parcial |
| M6 | Gestão de Unidades Produtivas (multi-tenant) | Completo |
| M7 | Rastreabilidade pública via QR Code + PDF | Parcial |
| M8 | Modo Offline (PWA + IndexedDB + sync) | Completo (resolução de conflitos no [backlog](BACKLOG.md)) |
| M9 | Auditoria (trilha de logs F12) | Completo |
| M9 | Fluxo de Aprovação Docente (N01) | Não iniciado — em avaliação (ver [backlog](BACKLOG.md)) |

---

## Convenções de Desenvolvimento

### Commits

Padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(m3): adiciona campo estadio_fenologico no diário
fix(auth): corrige refresh token expirado retornando 500
docs: atualiza README com referência de API
chore: bump django 5.1.6 -> 5.1.7
```

### Branches

```
feature/m<n>-<descricao>   # Nova funcionalidade
fix/<descricao>            # Correção de bug
docs/<descricao>           # Documentação
```

### Estilo de código

- **Backend:** PEP 8 — permissões sempre verificadas no backend, nunca só no frontend
- **Frontend:** ESLint + TypeScript strict — sem `any` implícito
- **Comentários:** apenas quando o *porquê* não é óbvio pelo código

### Adicionando um novo app Django

```bash
cd backend
python manage.py startapp <nome>
```

Registre em `INSTALLED_APPS` (`config/settings.py`) e adicione as rotas em `config/urls.py`. Para multi-tenant, herde de `BaseTenantViewSet` (`core/views.py`).

### PWA e offline

O CRUD do diário (criar, editar e excluir) funciona offline. Quando
`!navigator.onLine` — ou quando uma requisição falha por rede — a operação é
enfileirada em **IndexedDB** via `offlineQueue` (`frontend/src/utils/offlineQueue.ts`):

- Cada item guarda a operação (`criar` / `atualizar` / `deletar`) e, no caso de
  anexo, o **arquivo (`File`/`Blob`) é armazenado de forma nativa** — sem
  conversão para base64 (evita o teto de ~5 MB e a inflação de ~33% do
  localStorage, e não bloqueia a main thread).
- O sync roda automaticamente ao reconectar (`window.online`), enviando
  `POST`/`PATCH`/`DELETE`. Cada item é removido individualmente da fila ao ser
  confirmado pelo servidor (atômico, sem race condition). Um guard de
  concorrência impede envio duplicado quando App e página disparam o sync juntos.
- A UI do diário mostra um indicador de status offline + nº de registros
  pendentes de sincronização.

> Conflitos são resolvidos hoje por *last-write-wins*. A detecção/sinalização de
> conflitos (versionamento + HTTP 409) está no [BACKLOG.md](BACKLOG.md).

---

## Licença

Uso interno do Instituto Federal do Sertão Pernambucano.
