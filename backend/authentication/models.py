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
    
    # In backend/authentication/models.py, inside CustomUserManager

def create_superuser(self, email, password=None, **extra_fields):
    """
    Creates and saves a superuser with the given email and password,
    and forces the role to 'developer'.
    """
    extra_fields.setdefault('is_staff', True)
    extra_fields.setdefault('is_superuser', True)

    if extra_fields.get('is_staff') is not True:
        raise ValueError('Superuser must have is_staff=True.')
    if extra_fields.get('is_superuser') is not True:
        raise ValueError('Superuser must have is_superuser=True.')

    # Explicitly set the role for the superuser here. This is the key change.
    extra_fields['role'] = 'developer'

    # We now call the model directly, bypassing the create_user logic
    # to avoid any conflicts with default role assignment.
    if not email:
        raise ValueError('The Email field must be set')
    email = self.normalize_email(email)
    user = self.model(email=email, **extra_fields)
    
    user.set_password(password)
    user.save(using=self._db)
    return user


    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    current_stock = models.IntegerField()
    reorder_level = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name