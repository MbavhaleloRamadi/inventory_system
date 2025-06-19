# dashboard/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal

User = get_user_model()

class DashboardWidget(models.Model):
    """
    Model to define dashboard widgets for different roles
    """
    WIDGET_TYPES = [
        ('stat_card', 'Statistics Card'),
        ('chart', 'Chart'),
        ('table', 'Data Table'),
        ('progress', 'Progress Bar'),
        ('alert', 'Alert/Notification'),
        ('quick_action', 'Quick Action Button'),
    ]
    
    name = models.CharField(max_length=100)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    roles = models.JSONField(default=list, help_text="List of roles that can see this widget")
    config = models.JSONField(default=dict, help_text="Widget configuration parameters")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.title} ({self.widget_type})"

class DashboardMetric(models.Model):
    """
    Model to store dashboard metrics and KPIs
    """
    METRIC_TYPES = [
        ('count', 'Count'),
        ('sum', 'Sum'),
        ('average', 'Average'),
        ('percentage', 'Percentage'),
        ('currency', 'Currency'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200)
    metric_type = models.CharField(max_length=20, choices=METRIC_TYPES)
    value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    previous_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    target_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    roles = models.JSONField(default=list, help_text="Roles that can view this metric")
    category = models.CharField(max_length=50, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Hex color
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.display_name
    
    @property
    def change_percentage(self):
        if self.previous_value == 0:
            return 100 if self.value > 0 else 0
        return ((self.value - self.previous_value) / self.previous_value) * 100
    
    @property
    def is_positive_change(self):
        return self.value >= self.previous_value
    
    @property
    def progress_percentage(self):
        if self.target_value and self.target_value > 0:
            return min(float(self.value / self.target_value) * 100, 100)
        return 0

class ActivityLog(models.Model):
    """
    Model to track user activities for dashboard timeline
    """
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('create', 'Created Record'),
        ('update', 'Updated Record'),
        ('delete', 'Deleted Record'),
        ('approve', 'Approved Request'),
        ('reject', 'Rejected Request'),
        ('submit', 'Submitted Request'),
        ('system', 'System Action'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.user.name} - {self.title}"

class SystemAlert(models.Model):
    """
    Model for system-wide alerts and notifications
    """
    ALERT_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('success', 'Success'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, default='info')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='medium')
    roles = models.JSONField(default=list, help_text="Roles that should see this alert")
    is_active = models.BooleanField(default=True)
    auto_dismiss = models.BooleanField(default=False)
    dismiss_after = models.IntegerField(null=True, blank=True, help_text="Auto dismiss after X seconds")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_alerts')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    def is_expired(self):
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

class UserAlertStatus(models.Model):
    """
    Track which alerts have been seen/dismissed by users
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    alert = models.ForeignKey(SystemAlert, on_delete=models.CASCADE)
    is_seen = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    seen_at = models.DateTimeField(null=True, blank=True)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'alert']
    
    def mark_as_seen(self):
        if not self.is_seen:
            self.is_seen = True
            self.seen_at = timezone.now()
            self.save()
    
    def mark_as_dismissed(self):
        if not self.is_dismissed:
            self.is_dismissed = True
            self.dismissed_at = timezone.now()
            self.save()

class QuickAction(models.Model):
    """
    Model for quick action buttons on dashboard
    """
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    url = models.CharField(max_length=200, help_text="URL or route name")
    roles = models.JSONField(default=list)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    requires_permission = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.title

class DashboardLayout(models.Model):
    """
    Model to store user-specific dashboard layouts
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='dashboard_layout')
    layout_config = models.JSONField(default=dict, help_text="Dashboard layout configuration")
    widgets_config = models.JSONField(default=dict, help_text="Widget-specific configurations")
    theme = models.CharField(max_length=20, default='light', choices=[('light', 'Light'), ('dark', 'Dark')])
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.name}'s Dashboard Layout"