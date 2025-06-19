# authentication/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # User roles
    ROLE_CHOICES = [
        ('developer', 'Developer'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
        ('procurement', 'Procurement'),
        ('finance', 'Finance'),
        ('logistics', 'Logistics'),
    ]
    
    name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='staff',
        help_text='User role determines system access permissions'
    )
    department = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_users'
    )
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['email']
    
    def __str__(self):
        return f"{self.name} ({self.email}) - {self.get_role_display()}"
    
    def save(self, *args, **kwargs):
        # Auto-generate username from email if not provided
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)
    
    @property
    def is_developer(self):
        return self.role == 'developer'
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def is_manager(self):
        return self.role == 'manager'
    
    @property
    def is_staff_user(self):
        return self.role == 'staff'
    
    @property
    def is_procurement(self):
        return self.role == 'procurement'
    
    @property
    def is_finance(self):
        return self.role == 'finance'
    
    @property
    def is_logistics(self):
        return self.role == 'logistics'
    
    def can_access_admin_panel(self):
        """Check if user can access Django admin panel"""
        return self.role in ['developer', 'admin'] and self.is_staff
    
    def can_manage_users(self):
        """Check if user can create/edit other users"""
        return self.role in ['developer', 'admin']
    
    def can_approve_requisitions(self):
        """Check if user can approve requisitions"""
        return self.role in ['developer', 'admin', 'manager']
    
    def can_manage_inventory(self):
        """Check if user can add/edit inventory items"""
        return self.role in ['developer', 'admin', 'manager', 'staff']
    
    def can_create_purchase_orders(self):
        """Check if user can create purchase orders"""
        return self.role in ['developer', 'admin', 'manager', 'procurement']
    
    def can_view_financial_reports(self):
        """Check if user can view financial reports"""
        return self.role in ['developer', 'admin', 'manager', 'finance']