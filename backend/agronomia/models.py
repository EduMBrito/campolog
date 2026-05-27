from django.db import models


class Cultura(models.Model):
    """Catálogo do que o Instituto cultiva (Ex: Coentro, Milho, Uva)"""
    nome = models.CharField(max_length=100)
    variedade = models.CharField(max_length=100, blank=True, null=True, help_text="Ex: Verdão, Crioulo")

    def __str__(self):
        return f"{self.nome} - {self.variedade}" if self.variedade else self.nome


class Talhao(models.Model):
    """Unidades Produtivas / Áreas Físicas de plantio"""
    nome = models.CharField(max_length=100, help_text="Ex: Setor A - Parcela 04")
    area_m2 = models.FloatField(help_text="Área em metros quadrados")
    coordenadas = models.TextField(blank=True, null=True, help_text="Coordenadas GPS do polígono")
    unidade = models.ForeignKey('caderno.UnidadeProdutiva', on_delete=models.CASCADE, related_name='talhoes')

    def __str__(self):
        return self.nome


class CicloCultivo(models.Model):
    """A união do Talhão com a Cultura durante um período de tempo"""
    STATUS_CHOICES = [
        ('PLANEJADO', 'Planejado'),
        ('ATIVO', 'Ativo / Em andamento'),
        ('COLHIDO', 'Colhido / Finalizado'),
        ('CANCELADO', 'Cancelado'),
    ]

    unidade = models.ForeignKey('caderno.UnidadeProdutiva', on_delete=models.CASCADE, related_name='ciclos')
    talhao = models.ForeignKey(Talhao, on_delete=models.CASCADE)
    cultura = models.ForeignKey(Cultura, on_delete=models.PROTECT, related_name='ciclos')
    data_inicio = models.DateField()
    data_fim_prevista = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANEJADO')

    def __str__(self):
        return f"{self.cultura.nome} em {self.talhao.nome} ({self.data_inicio.strftime('%Y')})"
