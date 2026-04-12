# 🌱 CampoLog

**Transformando manejo em informação**

Sistema de Caderno de Campo Digital desenvolvido para o Instituto Federal de Educação do Sertão Pernambucano. Transforma o registro manual de atividades agrícolas em um processo digital, rastreável e inteligente.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Python 3.12 + Django 5.x + Django REST Framework |
| Banco de Dados | PostgreSQL 16 + PostGIS |
| Frontend | React 18 + TypeScript (PWA) |
| Servidor | Nginx + Gunicorn |
| Containerização | Docker + Docker Compose |

## Pré-requisitos

- Python 3.12+
- Node.js 20 LTS
- PostgreSQL 16 + PostGIS
- Docker + Docker Compose
- Git

## Instalação (Desenvolvimento)

### 1. Clone o repositório

```bash
git clone https://github.com/EduMBrito/campolog.git
cd campolog
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

O backend estará em `http://localhost:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará em `http://localhost:5173`

### 4. Docker (alternativa)

```bash
docker compose up --build
```

## Estrutura do Projeto

```
campolog/
├── backend/                # Django + DRF
│   ├── config/             # Settings, URLs, WSGI/ASGI
│   ├── core/               # App principal (models, views, serializers)
│   ├── manage.py
│   └── requirements.txt
├── frontend/               # React 18 + TypeScript + PWA
│   ├── src/
│   ├── public/
│   └── package.json
├── docker/                 # Dockerfiles e configs
│   ├── backend.Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Módulos de Entrega

| Cód. | Módulo | Sprint |
|------|--------|--------|
| M0 | Fundação do Projeto | 1 |
| M1 | Autenticação e Perfis | 2 |
| M2 | Cadastro de Talhões e Ciclos | 3 |
| M3 | Registro de Intervenções | 4 |
| M4 | Catálogo de Insumos e Carência | 5 |
| M5 | Observações e Monitoramento | 6 |
| M6 | Upload de Evidências | 7 |
| M7 | Relatórios e QR Code | 8 |
| M8 | Modo Offline (PWA) | 9 |
| M9 | Auditoria e Validação | 10 |

## Licença

Este projeto é de uso interno do IF Sertão Pernambucano.
