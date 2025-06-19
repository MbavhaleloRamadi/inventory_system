# authentication/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # The forms to add and change user instances
    list_display = ('email', 'name', 'username', 'role', 'department', 'is_active', 'date_joined')
    list_filter = ('role', 'department', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('email', 'name', 'username', 'department')
    ordering = ('-date_joined',)
    
    # Fieldsets for the change form
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'username', 'phone', 'department')}),
        ('Role & Permissions', {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
        ('Management', {
            'fields': ('created_by',),
            'classes': ('collapse',)
        }),
    )
    
    # Fieldsets for the add form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'password1', 'password2', 'role', 'department', 'phone'),
        }),
        ('Permissions', {
            'classes': ('wide',),
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )
    
    # Fields that are read-only
    readonly_fields = ('date_joined', 'last_login')
    
    # Filter horizontal for many-to-many fields
    filter_horizontal = ('groups', 'user_permissions')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Developers can see all users, admins can't see other developers
        if request.user.is_superuser or request.user.role == 'developer':
            return qs
        elif getattr(request.user, 'role', None) == 'admin':
            return qs.exclude(role='developer')
        return qs.filter(id=request.user.id)
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating a new user
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def has_delete_permission(self, request, obj=None):
        # Users can't delete themselves or higher-level users
        if obj and obj.id == request.user.id:
            return False
        if obj and obj.role == 'developer' and request.user.role != 'developer':
            return False
        return super