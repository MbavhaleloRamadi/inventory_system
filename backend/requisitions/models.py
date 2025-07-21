# requisitions/models.py
from django.db import models
from django.conf import settings
from inventory.models import InventoryItem

class Requisition(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('dispatched', 'Dispatched'),
        ('completed', 'Completed'),
    ]

    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='requisitions', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date_requested = models.DateTimeField(auto_now_add=True)
    date_approved = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='approved_requisitions', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Requisition {self.id} by {self.requested_by.email}"

class RequisitionItem(models.Model):
    requisition = models.ForeignKey(Requisition, related_name='items', on_delete=models.CASCADE)
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quantity} of {self.item.name} for Requisition {self.requisition.id}"