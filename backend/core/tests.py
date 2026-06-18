from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from caderno.models import UnidadeProdutiva, RegistoCampo
from agronomia.models import Cultura, Talhao, CicloCultivo
from core.models import LogAuditoria

User = get_user_model()


class AuditoriaTestCase(APITestCase):
    def setUp(self):
        self.unidade = UnidadeProdutiva.objects.create(nome="Campus Teste")

        self.discente = User.objects.create_user(username="aluno", password="x", role="DISCENTE")
        self.docente = User.objects.create_user(username="prof", password="x", role="DOCENTE")
        self.auditor = User.objects.create_user(username="fiscal", password="x", role="AUDITOR")
        self.admin = User.objects.create_user(username="chefe", password="x", role="ADMIN")

        for u in (self.discente, self.docente, self.auditor, self.admin):
            self.unidade.usuarios.add(u)

        self.cultura = Cultura.objects.create(nome="Coentro")
        self.headers = {"HTTP_X_UNIDADE_ID": str(self.unidade.id)}

    # ---- CRUD de Talhão gera os 3 tipos de log ----

    def test_criar_atualizar_excluir_talhao_gera_logs(self):
        self.client.force_authenticate(self.docente)

        # CRIAR
        resp = self.client.post(
            "/api/agronomia/talhoes/",
            {"nome": "Setor A", "area_m2": 100},
            **self.headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)
        talhao_id = resp.data["id"]

        log = LogAuditoria.objects.get(entidade="Talhao", acao="CRIAR", entidade_id=str(talhao_id))
        self.assertEqual(log.usuario, self.docente)
        self.assertEqual(log.usuario_nome, "prof")
        self.assertEqual(log.unidade_id, self.unidade.id)
        self.assertEqual(log.dados_novos["nome"], "Setor A")
        self.assertIsNone(log.dados_anteriores)

        # ATUALIZAR
        resp = self.client.patch(
            f"/api/agronomia/talhoes/{talhao_id}/",
            {"nome": "Setor A - Renomeado"},
            **self.headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)

        log = LogAuditoria.objects.get(entidade="Talhao", acao="ATUALIZAR", entidade_id=str(talhao_id))
        self.assertEqual(log.dados_anteriores["nome"], "Setor A")
        self.assertEqual(log.dados_novos["nome"], "Setor A - Renomeado")

        # EXCLUIR
        resp = self.client.delete(f"/api/agronomia/talhoes/{talhao_id}/", **self.headers)
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT, resp.content)

        log = LogAuditoria.objects.get(entidade="Talhao", acao="EXCLUIR", entidade_id=str(talhao_id))
        self.assertEqual(log.dados_anteriores["nome"], "Setor A - Renomeado")
        self.assertEqual(log.entidade_id, str(talhao_id))

    # ---- Registo do diário captura autor ----

    def test_criar_registo_diario_gera_log_com_autor(self):
        talhao = Talhao.objects.create(nome="Setor B", area_m2=50, unidade=self.unidade)
        ciclo = CicloCultivo.objects.create(
            unidade=self.unidade, talhao=talhao, cultura=self.cultura,
            data_inicio="2026-01-01", data_fim_prevista="2026-03-01",
        )

        self.client.force_authenticate(self.discente)
        resp = self.client.post(
            "/api/caderno/diario/",
            {"ciclo": ciclo.id, "tipo": "REGA", "descricao": "Irrigação matinal"},
            **self.headers,
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.content)

        log = LogAuditoria.objects.get(entidade="RegistoCampo", acao="CRIAR")
        self.assertEqual(log.usuario, self.discente)
        self.assertEqual(log.dados_novos["descricao"], "Irrigação matinal")
        self.assertEqual(log.unidade_id, self.unidade.id)

    # ---- Endpoint de leitura: permissões ----

    def test_auditor_le_logs_da_unidade(self):
        Talhao.objects.create(nome="X", area_m2=1, unidade=self.unidade)
        LogAuditoria.objects.create(acao="CRIAR", entidade="Talhao", entidade_id="1", unidade=self.unidade)

        self.client.force_authenticate(self.auditor)
        resp = self.client.get("/api/auditoria/logs/", **self.headers)
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        results = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        self.assertGreaterEqual(len(results), 1)

    def test_discente_nao_acessa_logs(self):
        self.client.force_authenticate(self.discente)
        resp = self.client.get("/api/auditoria/logs/", **self.headers)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_ve_todos_os_logs(self):
        outra = UnidadeProdutiva.objects.create(nome="Outro Campus")
        LogAuditoria.objects.create(acao="CRIAR", entidade="Talhao", entidade_id="9", unidade=outra)

        self.client.force_authenticate(self.admin)
        # admin sem header de unidade ainda vê tudo
        resp = self.client.get("/api/auditoria/logs/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK, resp.content)
        results = resp.data["results"] if isinstance(resp.data, dict) and "results" in resp.data else resp.data
        self.assertGreaterEqual(len(results), 1)
