from django.db import models
from django.contrib.auth import get_user_model
from agronomia.models import CicloCultivo

User = get_user_model()

class RegistoCampo(models.Model):
    """Registo de atividades e observações diárias num ciclo de cultivo"""
    
    TIPO_CHOICES = [
        ('REGA', 'Rega / Irrigação'),
        ('INSUMO', 'Aplicação de Insumo / Adubo'),
        ('OBSERVACAO', 'Observação (Pragas, Doenças, Fenologia)'),
        ('COLHEITA', 'Colheita'),
        ('OUTRO', 'Outra Operação'),
    ]

    # Relações
    ciclo = models.ForeignKey(CicloCultivo, on_delete=models.CASCADE, related_name='registos_campo')
    autor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='meus_registos')
    
    # Dados do Registo
    data_registo = models.DateTimeField(auto_now_add=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descricao = models.TextField(help_text="Detalhes da atividade, produto utilizado ou observação visual.")
    
    # Campos Opcionais para métricas
    quantidade = models.CharField(max_length=100, blank=True, null=True, help_text="Ex: 2 Litros de calda, 10kg colhidos")
    
    class Meta:
        ordering = ['-data_registo'] # Ordena sempre do mais recente para o mais antigo

    def __str__(self):
        return f"[{self.get_tipo_display()}] {self.ciclo.talhao.nome} - {self.data_registo.strftime('%d/%m/%Y')}"