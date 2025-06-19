# dashboard/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import (
    DashboardWidget, DashboardMetric, ActivityLog, 
    SystemAlert, UserAlertStatus, QuickAction, DashboardLayout
)
from .serializers import (
    DashboardMetricSerializer, ActivityLogSerializer,
    SystemAlertSerializer, QuickActionSerializer,
    DashboardLayoutSerializer, DashboardOverviewSerializer,
    StatCardData, ChartDataSerializer, TableDataSerializer
)
from authentication.permissions import RoleBasedPermission

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def index(request):
    """
    Dashboard index endpoint - redirects to dashboard_overview
    """
    return dashboard_overview(request)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_overview(request):
    """
    Get complete dashboard overview based on user role
    """
    user = request.user
    user_role = user.role
    
    # Get role-specific metrics
    metrics = DashboardMetric.objects.filter(
        Q(roles__contains=[user_role]) | Q(roles=[])
    ).order_by('category', 'display_name')
    
    # Get role-specific widgets
    widgets = DashboardWidget.objects.filter(
        Q(roles__contains=[user_role]) | Q(roles=[]),
        is_active=True
    ).order_by('order')
    
    # Get recent activities (last 7 days)
    recent_activities = ActivityLog.objects.filter(
        timestamp__gte=timezone.now() - timedelta(days=7)
    )[:10]
    
    # Get active alerts for user's role
    active_alerts = SystemAlert.objects.filter(
        (Q(roles__contains=[user_role]) | Q(roles=[])) &
        (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())),
        is_active=True
    ).exclude(
        useralertstatus__user=user,
        useralertstatus__is_dismissed=True
    ).order_by('-priority', '-created_at')
    
    # Get role-specific quick actions
    quick_actions = QuickAction.objects.filter(
        Q(roles__contains=[user_role]) | Q(roles=[]),
        is_active=True
    ).order_by('order')
    
    # Filter quick actions by permissions
    filtered_actions = []
    for action in quick_actions:
        if action.requires_permission:
            if hasattr(user, action.requires_permission) and getattr(user, action.requires_permission)():
                filtered_actions.append(action)
        else:
            filtered_actions.append(action)
    
    # Get or create user dashboard layout
    layout, created = DashboardLayout.objects.get_or_create(user=user)
    
    # User permissions
    permissions = {
        'can_manage_users': user.can_manage_users(),
        'can_approve_requisitions': user.can_approve_requisitions(),
        'can_manage_inventory': user.can_manage_inventory(),
        'can_create_purchase_orders': user.can_create_purchase_orders(),
        'can_view_financial_reports': user.can_view_financial_reports(),
        'role': user.role,
        'role_display': user.get_role_display(),
    }
    
    data = {
        'metrics': DashboardMetricSerializer(metrics, many=True).data,
        'widgets': [get_widget_data(widget, user) for widget in widgets],
        'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
        'active_alerts': SystemAlertSerializer(active_alerts, many=True).data,
        'quick_actions': QuickActionSerializer(filtered_actions, many=True).data,
        'user_permissions': permissions,
        'layout_config': DashboardLayoutSerializer(layout).data,
    }
    
    return Response(data)

def get_widget_data(widget, user):
    """
    Get specific widget data based on widget type and user role
    """
    base_data = {
        'id': widget.id,
        'name': widget.name,
        'widget_type': widget.widget_type,
        'title': widget.title,
        'description': widget.description,
        'config': widget.config,
        'order': widget.order,
    }
    
    # Add widget-specific data based on type
    if widget.widget_type == 'stat_card':
        base_data['data'] = get_stat_card_data(widget, user)
    elif widget.widget_type == 'chart':
        base_data['data'] = get_chart_data(widget, user)
    elif widget.widget_type == 'table':
        base_data['data'] = get_table_data(widget, user)
    elif widget.widget_type == 'progress':
        base_data['data'] = get_progress_data(widget, user)
    
    return base_data

def get_stat_card_data(widget, user):
    """
    Generate data for statistics card widgets based on user role
    """
    config = widget.config
    role = user.role
    
    # Example stat cards based on role
    if role in ['developer', 'admin']:
        if widget.name == 'total_users':
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            return {
                'title': 'Total Users',
                'value': str(total_users),
                'subtitle': f'{active_users} active',
                'icon': 'users',
                'color': '#3B82F6'
            }
        elif widget.name == 'system_health':
            return {
                'title': 'System Health',
                'value': '98.5%',
                'change': Decimal('2.1'),
                'change_type': 'increase',
                'icon': 'activity',
                'color': '#10B981'
            }
    
    elif role == 'manager':
        if widget.name == 'pending_approvals':
            # This would connect to your actual approval system
            return {
                'title': 'Pending Approvals',
                'value': '12',
                'change': Decimal('-3'),
                'change_type': 'decrease',
                'icon': 'clock',
                'color': '#F59E0B'
            }
        elif widget.name == 'team_performance':
            return {
                'title': 'Team Performance',
                'value': '94%',
                'change': Decimal('5.2'),
                'change_type': 'increase',
                'icon': 'trending-up',
                'color': '#10B981'
            }
    
    elif role == 'finance':
        if widget.name == 'monthly_budget':
            return {
                'title': 'Monthly Budget',
                'value': '$45,280',
                'subtitle': '68% utilized',
                'icon': 'dollar-sign',
                'color': '#8B5CF6'
            }
        elif widget.name == 'pending_payments':
            return {
                'title': 'Pending Payments',
                'value': '$12,450',
                'change': Decimal('15.3'),
                'change_type': 'increase',
                'icon': 'credit-card',
                'color': '#EF4444'
            }
    
    # Default fallback
    return {
        'title': widget.title,
        'value': '0',
        'icon': 'info',
        'color': '#6B7280'
    }

def get_chart_data(widget, user):
    """
    Generate chart data based on widget configuration and user role
    """
    config = widget.config
    role = user.role
    
    # Example charts based on role
    if role in ['developer', 'admin'] and widget.name == 'user_registrations':
        # Last 7 days user registrations
        dates = [(timezone.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(6, -1, -1)]
        data = [5, 8, 12, 7, 15, 10, 9]  # Example data
        
        return {
            'chart_type': 'line',
            'labels': dates,
            'datasets': [{
                'label': 'New Users',
                'data': data,
                'borderColor': '#3B82F6',
                'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                'tension': 0.4
            }]
        }
    
    elif role == 'finance' and widget.name == 'expense_breakdown':
        return {
            'chart_type': 'doughnut',
            'labels': ['Operations', 'Marketing', 'Development', 'HR'],
            'datasets': [{
                'data': [45, 25, 20, 10],
                'backgroundColor': ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
            }]
        }
    
    # Default empty chart
    return {
        'chart_type': 'line',
        'labels': [],
        'datasets': []
    }

def get_table_data(widget, user):
    """
    Generate table data based on widget configuration and user role
    """
    if user.role in ['developer', 'admin'] and widget.name == 'recent_users':
        recent_users = User.objects.order_by('-date_joined')[:5]
        
        return {
            'headers': [
                {'key': 'name', 'label': 'Name'},
                {'key': 'email', 'label': 'Email'},
                {'key': 'role', 'label': 'Role'},
                {'key': 'date_joined', 'label': 'Joined'}
            ],
            'rows': [
                [
                    user.name or 'N/A',
                    user.email,
                    user.get_role_display(),
                    user.date_joined.strftime('%Y-%m-%d')
                ] for user in recent_users
            ]
        }
    
    return {'headers': [], 'rows': []}

def get_progress_data(widget, user):
    """
    Generate progress data based on widget configuration and user role
    """
    if user.role == 'manager' and widget.name == 'monthly_goals':
        return {
            'title': 'Monthly Goals',
            'current': Decimal('750'),
            'target': Decimal('1000'),
            'percentage': Decimal('75.0'),
            'color': '#10B981',
            'description': 'On track to meet monthly targets'
        }
    
    return {
        'title': widget.title,
        'current': Decimal('0'),
        'target': Decimal('100'),
        'percentage': Decimal('0'),
        'color': '#6B7280'
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_role_specific_metrics(request):
    """
    Get metrics specific to user's role
    """
    user = request.user
    metrics = DashboardMetric.objects.filter(
        Q(roles__contains=[user.role]) | Q(roles=[])
    )
    
    serializer = DashboardMetricSerializer(metrics, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """
    Log user activity
    """
    data = request.data
    
    activity = ActivityLog.objects.create(
        user=request.user,
        activity_type=data.get('activity_type', 'system'),
        title=data.get('title', ''),
        description=data.get('description', ''),
        metadata=data.get('metadata', {}),
        ip_address=get_client_ip(request)
    )
    
    return Response({'message': 'Activity logged', 'id': activity.id})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_alerts(request):
    """
    Get active alerts for the current user
    """
    user = request.user
    alerts = SystemAlert.objects.filter(
        (Q(roles__contains=[user.role]) | Q(roles=[])) &
        (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())),
        is_active=True
    ).exclude(
        useralertstatus__user=user,
        useralertstatus__is_dismissed=True
    )
    
    serializer = SystemAlertSerializer(alerts, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_alert(request, alert_id):
    """
    Dismiss an alert for the current user
    """
    try:
        alert = SystemAlert.objects.get(id=alert_id)
        alert_status, created = UserAlertStatus.objects.get_or_create(
            user=request.user,
            alert=alert
        )
        alert_status.mark_as_dismissed()
        
        return Response({'message': 'Alert dismissed'})
    except SystemAlert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_dashboard_layout(request):
    """
    Update user's dashboard layout configuration
    """
    layout, created = DashboardLayout.objects.get_or_create(user=request.user)
    
    serializer = DashboardLayoutSerializer(layout, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quick_actions(request):
    """
    Get quick actions available to the current user
    """
    user = request.user
    actions = QuickAction.objects.filter(
        Q(roles__contains=[user.role]) | Q(roles=[]),
        is_active=True
    ).order_by('order')
    
    # Filter by permissions
    filtered_actions = []
    for action in actions:
        if action.requires_permission:
            if hasattr(user, action.requires_permission) and getattr(user, action.requires_permission)():
                filtered_actions.append(action)
        else:
            filtered_actions.append(action)
    
    serializer = QuickActionSerializer(filtered_actions, many=True)
    return Response(serializer.data)

def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

# Role-specific dashboard views

class DeveloperDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    required_roles = ['developer']
    
    def get(self, request):
        # Developer-specific dashboard data
        data = {
            'system_stats': self.get_system_stats(),
            'recent_errors': self.get_recent_errors(),
            'code_metrics': self.get_code_metrics(),
            'deployment_status': self.get_deployment_status(),
        }
        return Response(data)
    
    def get_system_stats(self):
        """Get system statistics for developers"""
        return {
            'total_users': User.objects.count(),
            'active_sessions': User.objects.filter(last_login__gte=timezone.now() - timedelta(hours=24)).count(),
            'database_size': '2.3 GB',  # This would be calculated dynamically
            'api_calls_today': 15420,   # This would come from monitoring
        }
    
    def get_recent_errors(self):
        """Get recent system errors"""
        # This would typically come from your logging system
        return [
            {
                'timestamp': timezone.now() - timedelta(hours=2),
                'level': 'ERROR',
                'message': 'Database connection timeout',
                'count': 3
            },
            {
                'timestamp': timezone.now() - timedelta(hours=5),
                'level': 'WARNING',
                'message': 'High memory usage detected',
                'count': 1
            }
        ]
    
    def get_code_metrics(self):
        """Get code quality metrics"""
        return {
            'test_coverage': 85.2,
            'code_quality_score': 'A',
            'security_issues': 2,
            'technical_debt': '4.2 days'
        }
    
    def get_deployment_status(self):
        """Get deployment status information"""
        return {
            'last_deployment': timezone.now() - timedelta(days=2),
            'status': 'success',
            'version': 'v2.1.4',
            'environment': 'production'
        }

class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    required_roles = ['admin']
    
    def get(self, request):
        data = {
            'user_management': self.get_user_management_stats(),
            'system_health': self.get_system_health(),
            'security_alerts': self.get_security_alerts(),
            'backup_status': self.get_backup_status(),
        }
        return Response(data)
    
    def get_user_management_stats(self):
        """Get user management statistics"""
        return {
            'total_users': User.objects.count(),
            'new_users_today': User.objects.filter(date_joined__date=timezone.now().date()).count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'pending_approvals': 5,  # This would come from your approval system
        }
    
    def get_system_health(self):
        """Get system health metrics"""
        return {
            'uptime': '99.8%',
            'cpu_usage': 45.2,
            'memory_usage': 67.8,
            'disk_usage': 34.1,
            'response_time': 120  # milliseconds
        }
    
    def get_security_alerts(self):
        """Get security-related alerts"""
        return [
            {
                'type': 'failed_login_attempts',
                'count': 15,
                'severity': 'medium',
                'timestamp': timezone.now() - timedelta(hours=1)
            },
            {
                'type': 'unusual_activity',
                'count': 2,
                'severity': 'high',
                'timestamp': timezone.now() - timedelta(minutes=30)
            }
        ]
    
    def get_backup_status(self):
        """Get backup status information"""
        return {
            'last_backup': timezone.now() - timedelta(hours=6),
            'status': 'success',
            'size': '1.2 GB',
            'next_scheduled': timezone.now() + timedelta(hours=18)
        }

class ManagerDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    required_roles = ['manager', 'admin', 'developer']
    
    def get(self, request):
        data = {
            'team_overview': self.get_team_overview(),
            'pending_approvals': self.get_pending_approvals(),
            'performance_metrics': self.get_performance_metrics(),
            'budget_status': self.get_budget_status(),
        }
        return Response(data)
    
    def get_team_overview(self):
        """Get team overview statistics"""
        return {
            'team_size': User.objects.filter(role__in=['employee', 'finance', 'procurement']).count(),
            'active_projects': 12,  # This would come from your project management system
            'completed_tasks_today': 28,
            'productivity_score': 87.5
        }
    
    def get_pending_approvals(self):
        """Get pending approvals requiring manager attention"""
        return {
            'requisitions': 8,
            'leave_requests': 3,
            'expense_reports': 5,
            'purchase_orders': 2
        }
    
    def get_performance_metrics(self):
        """Get team performance metrics"""
        return {
            'average_completion_time': 2.3,  # days
            'quality_score': 94.2,
            'customer_satisfaction': 4.7,
            'efficiency_rating': 'Excellent'
        }
    
    def get_budget_status(self):
        """Get budget status information"""
        return {
            'monthly_budget': Decimal('50000.00'),
            'spent_this_month': Decimal('32450.75'),
            'remaining': Decimal('17549.25'),
            'utilization_percentage': 64.9
        }

class FinanceDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    required_roles = ['finance', 'admin']
    
    def get(self, request):
        data = {
            'financial_overview': self.get_financial_overview(),
            'pending_payments': self.get_pending_payments(),
            'budget_analysis': self.get_budget_analysis(),
            'expense_trends': self.get_expense_trends(),
        }
        return Response(data)
    
    def get_financial_overview(self):
        """Get financial overview statistics"""
        return {
            'monthly_revenue': Decimal('125000.00'),
            'monthly_expenses': Decimal('87500.00'),
            'profit_margin': 30.0,
            'cash_flow': Decimal('37500.00')
        }
    
    def get_pending_payments(self):
        """Get pending payments information"""
        return {
            'outgoing_payments': Decimal('23450.00'),
            'incoming_payments': Decimal('45600.00'),
            'overdue_invoices': 7,
            'payment_processing': 12
        }
    
    def get_budget_analysis(self):
        """Get budget analysis data"""
        return {
            'departments': [
                {'name': 'Operations', 'budget': 30000, 'spent': 18500, 'remaining': 11500},
                {'name': 'Marketing', 'budget': 15000, 'spent': 12300, 'remaining': 2700},
                {'name': 'HR', 'budget': 20000, 'spent': 8900, 'remaining': 11100},
                {'name': 'IT', 'budget': 25000, 'spent': 21200, 'remaining': 3800},
            ]
        }
    
    def get_expense_trends(self):
        """Get expense trend data"""
        return {
            'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'datasets': [{
                'label': 'Monthly Expenses',
                'data': [75000, 82000, 78000, 85000, 87500, 89000],
                'backgroundColor': 'rgba(239, 68, 68, 0.1)',
                'borderColor': '#EF4444'
            }]
        }

class EmployeeDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    required_roles = ['employee', 'manager', 'admin', 'developer']
    
    def get(self, request):
        data = {
            'personal_stats': self.get_personal_stats(request.user),
            'recent_activities': self.get_user_activities(request.user),
            'upcoming_tasks': self.get_upcoming_tasks(request.user),
            'announcements': self.get_announcements(),
        }
        return Response(data)
    
    def get_personal_stats(self, user):
        """Get personal statistics for the user"""
        return {
            'tasks_completed_today': ActivityLog.objects.filter(
                user=user,
                activity_type='update',
                timestamp__date=timezone.now().date()
            ).count(),
            'pending_tasks': 5,  # This would come from your task management system
            'hours_logged_today': 6.5,
            'productivity_score': 92.3
        }
    
    def get_user_activities(self, user):
        """Get recent activities for the user"""
        activities = ActivityLog.objects.filter(user=user)[:10]
        return ActivityLogSerializer(activities, many=True).data
    
    def get_upcoming_tasks(self, user):
        """Get upcoming tasks for the user"""
        # This would typically come from your task management system
        return [
            {
                'title': 'Complete quarterly report',
                'due_date': timezone.now() + timedelta(days=3),
                'priority': 'high',
                'progress': 75
            },
            {
                'title': 'Review vendor proposals',
                'due_date': timezone.now() + timedelta(days=5),
                'priority': 'medium',
                'progress': 25
            }
        ]
    
    def get_announcements(self):
        """Get company announcements"""
        return SystemAlert.objects.filter(
            Q(alert_type='info') &
            Q(is_active=True) &
            (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now()))
        ).order_by('-created_at')[:5]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_statistics(request):
    """
    Get general dashboard statistics
    """
    user = request.user
    
    # Base statistics available to all users
    stats = {
        'total_users': User.objects.count() if user.can_manage_users() else None,
        'active_users': User.objects.filter(is_active=True).count() if user.can_manage_users() else None,
        'user_activities_today': ActivityLog.objects.filter(
            timestamp__date=timezone.now().date()
        ).count(),
        'system_alerts': SystemAlert.objects.filter(
            is_active=True,
            alert_type__in=['warning', 'error']
        ).count() if user.role in ['admin', 'developer'] else None,
    }
    
    # Remove None values
    stats = {k: v for k, v in stats.items() if v is not None}
    
    return Response(stats)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_system_alert(request):
    """
    Create a new system alert (admin/developer only)
    """
    if request.user.role not in ['admin', 'developer']:
        return Response({'error': 'Permission denied'}, status=403)
    
    data = request.data
    alert = SystemAlert.objects.create(
        title=data.get('title'),
        message=data.get('message'),
        alert_type=data.get('alert_type', 'info'),
        priority=data.get('priority', 'medium'),
        roles=data.get('roles', []),
        created_by=request.user,
        expires_at=data.get('expires_at')
    )
    
    serializer = SystemAlertSerializer(alert)
    return Response(serializer.data, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_dashboard_data(request):
    """
    Export dashboard data based on user permissions
    """
    user = request.user
    export_format = request.GET.get('format', 'json')
    
    data = {}
    
    if user.can_manage_users():
        data['users'] = list(User.objects.values('id', 'name', 'email', 'role', 'is_active'))
    
    if user.role in ['admin', 'developer']:
        data['activities'] = list(ActivityLog.objects.values(
            'user__name', 'activity_type', 'title', 'timestamp'
        )[:100])
        data['alerts'] = list(SystemAlert.objects.values(
            'title', 'message', 'alert_type', 'priority', 'created_at'
        ))
    
    # Add user-specific data
    data['user_info'] = {
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'permissions': {
            'can_manage_users': user.can_manage_users(),
            'can_approve_requisitions': user.can_approve_requisitions(),
            'can_manage_inventory': user.can_manage_inventory(),
            'can_create_purchase_orders': user.can_create_purchase_orders(),
            'can_view_financial_reports': user.can_view_financial_reports(),
        }
    }
    
    if export_format == 'csv':
        # For CSV export, you'd need to implement CSV conversion
        # This is a simplified JSON response
        pass
    
    return Response(data)