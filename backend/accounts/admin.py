from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    # Adicionando o campo 'role' nas telas de edição do Admin
    fieldsets = UserAdmin.fieldsets + (
        ('Papel no Sistema (CampoLog)', {'fields': ('role',)}),
    )
    # Colunas que aparecerão na lista de usuários
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_active']

admin.site.register(User, CustomUserAdmin)