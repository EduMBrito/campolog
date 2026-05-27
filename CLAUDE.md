# CampoLog — Caderno de Campo Digital

> **Instituto Federal do Sertão Pernambucano**
> Versão do documento: 1.0 | Abril 2026
> _Transformando manejo em informação_

---

## Visão Geral

O **CampoLog** é um sistema de Caderno de Campo Digital desenvolvido para o IF Sertão
Pernambucano. Digitaliza o registro de atividades agrícolas, tornando-o rastreável,
auditável e acessível via navegador — inclusive offline no campo.

### Três pilares do sistema
1. **Rastreabilidade agrícola** — do plantio à colheita
2. **Suporte ao ensino e pesquisa** — registro por alunos com validação docente
3. **Conformidade com BPA** — normas de certificação e boas práticas agrícolas


---

## Stack Tecnológica

### Backend
- **Python 3.12 + Django 5.x** — framework principal
- **Django REST Framework** — API REST com autenticação JWT, paginação e throttling
- **PostgreSQL 16 + PostGIS** — banco de dados com suporte a dados geoespaciais

### Frontend
- **React 18 + TypeScript** — interface componentizada e tipada
- **PWA (Service Worker + IndexedDB)** — modo offline para uso no campo

### Infraestrutura
- **Nginx + Gunicorn** — servidor web de produção
- **Docker + Docker Compose** — três containers: backend, PostgreSQL e Nginx
- **Git + GitHub** — controle de versão em repositório público

### Utilitários
- **ReportLab / WeasyPrint** — geração de relatórios em PDF
- **python-qrcode** — geração de QR Codes por lote/talhão

---

## Arquitetura

Padrão **cliente-servidor com API REST**. O frontend React opera de forma independente
(modo offline) e consome a mesma API que futuras integrações poderão usar.

```
┌─────────────────────────────────────────────────────┐
│             CAMADA DE APRESENTAÇÃO                  │
│   React 18 + TypeScript | PWA | Mobile First        │
└──────────────────┬──────────────────────────────────┘
                   │  REST API (JSON + JWT)
┌──────────────────▼──────────────────────────────────┐
│              CAMADA DE NEGÓCIO                      │
│   Django 5.x + DRF | Auth JWT | Permissões por papel│
└──────────────────┬──────────────────────────────────┘
                   │  ORM Django
┌──────────────────▼──────────────────────────────────┐
│               CAMADA DE DADOS                       │
│       PostgreSQL 16 + PostGIS | Filesystem          │
└─────────────────────────────────────────────────────┘
```

### Estrutura do Repositório (monorepo)
```
campoLog/
├── backend/    # Django
└── frontend/   # React PWA
```

### Fluxo de Branches
- Branch por módulo: `feature/m1-autenticacao`, `feature/m2-talhoes`, etc.
- Integração à `main` após revisão e testes
- Commits no padrão **Conventional Commits**

---

## Perfis de Usuário e Permissões

| Perfil           | Permissões |
|------------------|------------|
| **Administrador**| Catálogos de insumos, configurações globais, gestão de todos os usuários |
| **Docente**      | Gestão de suas áreas/talhões, exportação de relatórios de pesquisa |
| **Discente**     | Lançamento de intervenções e observações diárias |
| **Auditor**      | Acesso somente leitura a todos os dados e relatórios |

---

## Modelo de Dados (Entidades Principais)

| Entidade         | Campos Principais |
|------------------|-------------------|
| `Usuario`        | id, nome, email, papel, data_criacao |
| `Talhao`         | id, nome, coordenadas (PostGIS), area_m2, descricao, status |
| `CicloCultivo`   | id, talhao_id, cultura, variedade, data_inicio, data_fim_prevista, status |
| `Atividade`      | id, ciclo_id, tipo, data_hora, descricao, usuario_id, status_aprovacao |
| `DetalheInsumo`  | id, atividade_id, produto_id, dosagem, volume_calda, lote, equipamento, carencia_dias |
| `Produto`        | id, nome_comercial, principio_ativo, tipo, carencia_dias |
| `Media`          | id, atividade_id, caminho_arquivo, tipo (foto/video), data_upload |
| `LogAuditoria`   | id, usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos, timestamp |

Arquivos de mídia (fotos/vídeos) são armazenados no **filesystem do servidor**,
organizados por talhão e data, com referências no banco.

---

## Plano de Entrega por Módulos

| Cód. | Módulo                      | Escopo                                                                                     | Sprint |
|------|-----------------------------|--------------------------------------------------------------------------------------------|--------|
| M0   | Fundação do Projeto         | Repositório, estrutura Django, PostgreSQL, React PWA base, Docker Compose, CI básico       | 1      |
| M1   | Autenticação e Perfis       | Cadastro/login JWT, perfis, permissões por papel, gestão de usuários                       | 2      |
| M2   | Talhões e Ciclos            | CRUD de talhões com georreferenciamento GPS, vínculo de culturas, histórico de ciclos      | 3      |
| M3   | Registro de Intervenções    | Intervenções técnicas (preparo, irrigação, poda), aplicação de insumos com dosagem         | 4      |
| M4   | Catálogo de Insumos e Carência | Catálogo de defensivos/fertilizantes, cálculo automático de carência, alertas de colheita | 5      |
| M5   | Observações e Monitoramento | Diário de ocorrências, monitoramento fenológico, severidade e ações imediatas              | 6      |
| M6   | Upload de Evidências        | Upload de fotos/vídeos, vinculação a atividades, compressão e armazenamento local          | 7      |
| M7   | Relatórios e QR Code        | Relatório de rastreabilidade (PDF/Excel), QR Code por lote/talhão, painel geral            | 8      |
| M8   | Modo Offline (PWA)          | Service Worker, IndexedDB, sincronização automática, resolução de conflitos                | 9      |
| M9   | Auditoria e Validação       | Logs de auditoria, fluxo de aprovação docente, status Pendente/Aprovado/Rejeitado          | 10     |

---

## Rastreabilidade: Requisitos x Módulos

| Req.  | Descrição                              | Módulo | Sprint |
|-------|----------------------------------------|--------|--------|
| F01   | Cadastro de talhões com georref.       | M2     | 3      |
| F02   | Vínculo e histórico de culturas        | M2     | 3      |
| F03   | Controle de lotes e rastreabilidade    | M2     | 3      |
| F04   | Lançamento de insumos                  | M3     | 4      |
| F05   | Gestão de período de carência          | M4     | 5      |
| F06   | Registro de intervenções gerais        | M3     | 4      |
| F07   | Diário de ocorrências                  | M5     | 6      |
| F08   | Monitoramento fenológico               | M5     | 6      |
| F09   | Upload de evidências digitais          | M6     | 7      |
| F10   | Relatório de rastreabilidade           | M7     | 8      |
| F11   | Geração de QR Code                     | M7     | 8      |
| F12   | Auditoria de usuários                  | M9     | 10     |
| NF01  | Operação offline (PWA)                 | M8     | 9      |
| NF02  | Interface mobile first                 | M0–M9  | Todos  |
| NF03  | Desempenho de sincronização            | M8     | 9      |
| N01   | Hierarquia de aprovação                | M9     | 10     |

---

## Identidade Visual

Conceito **Tech-Agro** — legibilidade em campo (luz solar direta).

| Cor       | Hex       | Nome         | Aplicação |
|-----------|-----------|--------------|-----------|
| 🟢        | `#2D5A27` | Verde Safra  | Navegação, botões principais, logotipo |
| 🔵        | `#1E293B` | Azul Log     | Textos principais, ícones, cabeçalhos |
| 🟡        | `#F59E0B` | Âmbar Alerta | Notificações, alertas de pragas, ações urgentes |
| ⬜        | `#F8FAFC` | Gelo Neutro  | Fundo da aplicação (reduz reflexo externo) |
| 🔲        | `#E2E8F0` | Cinza Borda  | Divisores, bordas de cards, inputs desativados |

**Tipografia:** Inter ou Roboto (sem serifa, legíveis em mobile).
**Modo escuro** disponível para análise de dados em escritório.

---

## Infraestrutura e Deploy

- Servidor Linux na rede interna do IF Sertão Pernambucano
- Deploy via `docker compose up` — sem etapas manuais complexas
- **Sem custos mensais** — toda a stack é open source

```bash
# Subir o ambiente completo
docker compose up -d

# Containers em execução:
#   campoLog-backend   → Django (Gunicorn) na porta 8000
#   campoLog-db        → PostgreSQL 16 com PostGIS
#   campoLog-nginx     → Nginx (frontend estático + proxy reverso)
```

---

## Convenções de Desenvolvimento

- **API:** REST com JSON; autenticação via JWT (Bearer token no header)
- **Branches:** `feature/m<n>-<descricao>` → PR → revisão → merge em `main`
- **Commits:** padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Permissões:** sempre verificadas no backend via decorators/permissions DRF
- **Georreferenciamento:** usar campos `geometry` do PostGIS via `django.contrib.gis`
- **Offline:** toda mutação deve enfileirar em IndexedDB quando sem rede e sincronizar ao reconectar
