# dashboard/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    DashboardWidget,
    DashboardMetric,
    ActivityLog,
    SystemAlert,
    UserAlertStatus,
    QuickAction,
    DashboardLayout
)

User = get_user_model()

class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = '__all__'

class DashboardMetricSerializer(serializers.ModelSerializer):
    change_percentage = serializers.ReadOnlyField()
    is_positive_change = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = DashboardMetric
        fields = [
            'id', 'name', 'display_name', 'metric_type', 'value', 
            'previous_value', 'target_value', 'category', 'icon', 
            'color', 'change_percentage', 'is_positive_change', 
            'progress_percentage', 'updated_at'
        ]

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user_name', 'user_role', 'activity_type', 'title', 
            'description', 'metadata', 'timestamp', 'time_ago'
        ]
    
    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.timestamp)

class SystemAlertSerializer(serializers.ModelSerializer):
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = SystemAlert
        fields = [
            'id', 'title', 'message', 'alert_type', 'priority', 
            'is_active', 'auto_dismiss', 'dismiss_after', 
            'created_at', 'expires_at', 'is_expired'
        ]

class UserAlertStatusSerializer(serializers.ModelSerializer):
    alert = SystemAlertSerializer(read_only=True)
    
    class Meta:
        model = UserAlertStatus
        fields = '__all__'

class QuickActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickAction
        fields = [
            'id', 'name', 'title', 'description', 'icon', 
            'color', 'url', 'order', 'requires_permission'
        ]

class DashboardLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardLayout
        fields = ['layout_config', 'widgets_config', 'theme', 'updated_at']

class DashboardOverviewSerializer(serializers.Serializer):
    """
    Serializer for complete dashboard overview data
    """
    metrics = DashboardMetricSerializer(many=True, read_only=True)
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    recent_activities = ActivityLogSerializer(many=True, read_only=True)
    active_alerts = SystemAlertSerializer(many=True, read_only=True)
    quick_actions = QuickActionSerializer(many=True, read_only=True)
    user_permissions = serializers.DictField(read_only=True)
    layout_config = DashboardLayoutSerializer(read_only=True)

class StatCardData(serializers.Serializer):
    """
    Serializer for statistics card widget data
    """
    title = serializers.CharField()
    value = serializers.CharField()
    change = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    change_type = serializers.ChoiceField(choices=['increase', 'decrease', 'neutral'], required=False)
    icon = serializers.CharField(required=False)
    color = serializers.CharField(required=False)
    subtitle = serializers.CharField(required=False)

class ChartDataSerializer(serializers.Serializer):
    """
    Serializer for chart widget data
    """
    labels = serializers.ListField(child=serializers.CharField())
    datasets = serializers.ListField(child=serializers.DictField())
    chart_type = serializers.ChoiceField(choices=['line', 'bar', 'pie', 'doughnut', 'area'])
    options = serializers.DictField(required=False)

class TableDataSerializer(serializers.Serializer):
    """
    Serializer for table widget data
    """
    headers = serializers.ListField(child=serializers.DictField())
    rows = serializers.ListField(child=serializers.ListField())
    total_count = serializers.IntegerField(required=False)
    pagination = serializers.DictField(required=False)

class ProgressDataSerializer(serializers.Serializer):
    """
    Serializer for progress widget data
    """
    title = serializers.CharField()
    current = serializers.DecimalField(max_digits=15, decimal_places=2)
    target = serializers.DecimalField(max_digits=15, decimal_places=2)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    color = serializers.CharField(required=False)
    description = serializers.CharField(required=False)