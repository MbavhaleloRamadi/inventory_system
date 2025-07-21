# inventory/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
    ]

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True, help_text="Stock Keeping Unit")
    description = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, related_name='items', on_delete=models.SET_NULL, null=True)
    location = models.ForeignKey(Location, related_name='items', on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, related_name='items', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=0)
    reorder_level = models.PositiveIntegerField(default=10, help_text="The stock level at which a new order is triggered.")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # New fields for more detailed stock tracking
    batch_number = models.CharField(max_length=100, blank=True, null=True, help_text="Batch or lot number for tracking a specific group of items.")
    expiry_date = models.DateField(null=True, blank=True, help_text="Expiry date for perishable goods.")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='new')
    date_added = models.DateTimeField(default=timezone.now)

    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level

    @property
    def is_expired(self):
        return self.expiry_date and self.expiry_date < timezone.now().date()