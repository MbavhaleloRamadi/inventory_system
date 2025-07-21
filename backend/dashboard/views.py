# dashboard/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q, F, Case, When, IntegerField
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import connection
from inventory.models import InventoryItem
from requisitions.models import Requisition
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
    
    total_items = InventoryItem.objects.count()
    low_stock_alerts = InventoryItem.objects.filter(quantity__lte=models.F('reorder_level')).count()
    pending_requests = Requisition.objects.filter(status='pending').count()
    
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
    Generate data for statistics card widgets based on user role with real database queries
    """
    config = widget.config
    role = user.role
    
    # Get current date ranges for calculations
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    last_30_days = today - timedelta(days=30)
    previous_30_days = today - timedelta(days=60)
    
    if role in ['developer', 'admin']:
        if widget.name == 'total_users':
            # Real user statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            
            # Calculate percentage change from last month
            current_month_users = User.objects.filter(date_joined__gte=last_30_days).count()
            previous_month_users = User.objects.filter(
                date_joined__gte=previous_30_days,
                date_joined__lt=last_30_days
            ).count()
            
            change = 0
            if previous_month_users > 0:
                change = ((current_month_users - previous_month_users) / previous_month_users) * 100
            
            return {
                'title': 'Total Users',
                'value': str(total_users),
                'subtitle': f'{active_users} active',
                'change': Decimal(str(round(change, 1))),
                'change_type': 'increase' if change >= 0 else 'decrease',
                'icon': 'users',
                'color': '#3B82F6'
            }
            
        elif widget.name == 'system_health':
            # Calculate system health based on real metrics
            total_alerts = SystemAlert.objects.filter(
                is_active=True,
                alert_type__in=['error', 'warning']
            ).count()
            
            error_alerts = SystemAlert.objects.filter(
                is_active=True,
                alert_type='error'
            ).count()
            
            # Simple health calculation (you can make this more sophisticated)
            base_health = 100
            health_score = max(0, base_health - (error_alerts * 10) - (total_alerts * 2))
            
            # Compare with yesterday's alerts
            yesterday_alerts = SystemAlert.objects.filter(
                created_at__date=yesterday,
                alert_type__in=['error', 'warning']
            ).count()
            
            today_alerts = SystemAlert.objects.filter(
                created_at__date=today,
                alert_type__in=['error', 'warning']
            ).count()
            
            alert_change = today_alerts - yesterday_alerts
            health_change = -alert_change * 2  # Inverse relationship
            
            return {
                'title': 'System Health',
                'value': f'{health_score}%',
                'change': Decimal(str(abs(health_change))),
                'change_type': 'increase' if health_change >= 0 else 'decrease',
                'icon': 'activity',
                'color': '#10B981' if health_score > 80 else '#F59E0B' if health_score > 60 else '#EF4444'
            }
            
        elif widget.name == 'daily_active_users':
            # Daily active users (users who logged activity today)
            daily_active = User.objects.filter(
                activitylog__timestamp__date=today
            ).distinct().count()
            
            yesterday_active = User.objects.filter(
                activitylog__timestamp__date=yesterday
            ).distinct().count()
            
            change = 0
            if yesterday_active > 0:
                change = ((daily_active - yesterday_active) / yesterday_active) * 100
            
            return {
                'title': 'Daily Active Users',
                'value': str(daily_active),
                'change': Decimal(str(round(abs(change), 1))),
                'change_type': 'increase' if change >= 0 else 'decrease',
                'icon': 'user-check',
                'color': '#10B981'
            }
    
    elif role == 'manager':
        if widget.name == 'pending_approvals':
            # Real pending approvals count (you'll need to adjust based on your approval models)
            # This assumes you have models for various approval types
            pending_count = 0
            
            # Add counts from various approval sources
            # Example: pending_count += RequisitionApproval.objects.filter(status='pending').count()
            # Example: pending_count += LeaveRequest.objects.filter(status='pending').count()
            # Example: pending_count += ExpenseReport.objects.filter(status='pending').count()
            
            # For now, let's use activity logs as a proxy for pending items
            pending_activities = ActivityLog.objects.filter(
                activity_type='approval_required',
                timestamp__gte=last_30_days
            ).count()
            
            # Compare with last week
            last_week = today - timedelta(days=7)
            previous_week_pending = ActivityLog.objects.filter(
                activity_type='approval_required',
                timestamp__gte=last_week - timedelta(days=7),
                timestamp__lt=last_week
            ).count()
            
            change = pending_activities - previous_week_pending
            
            return {
                'title': 'Pending Items',
                'value': str(pending_activities),
                'change': Decimal(str(abs(change))),
                'change_type': 'decrease' if change < 0 else 'increase',
                'icon': 'clock',
                'color': '#F59E0B' if pending_activities > 10 else '#10B981'
            }
            
        elif widget.name == 'team_performance':
            # Calculate team performance based on completed activities
            completed_today = ActivityLog.objects.filter(
                activity_type='completed',
                timestamp__date=today
            ).count()
            
            total_activities_today = ActivityLog.objects.filter(
                timestamp__date=today
            ).count()
            
            performance = 0
            if total_activities_today > 0:
                performance = (completed_today / total_activities_today) * 100
            
            # Compare with yesterday
            completed_yesterday = ActivityLog.objects.filter(
                activity_type='completed',
                timestamp__date=yesterday
            ).count()
            
            total_yesterday = ActivityLog.objects.filter(
                timestamp__date=yesterday
            ).count()
            
            yesterday_performance = 0
            if total_yesterday > 0:
                yesterday_performance = (completed_yesterday / total_yesterday) * 100
            
            change = performance - yesterday_performance
            
            return {
                'title': 'Team Performance',
                'value': f'{performance:.0f}%',
                'change': Decimal(str(round(abs(change), 1))),
                'change_type': 'increase' if change >= 0 else 'decrease',
                'icon': 'trending-up',
                'color': '#10B981' if performance > 80 else '#F59E0B'
            }
            
        elif widget.name == 'active_projects':
            # Count active projects (you'll need to adjust based on your project model)
            # For now, using unique activity categories as proxy for projects
            active_projects = ActivityLog.objects.filter(
                timestamp__gte=last_30_days
            ).values('metadata__project_id').distinct().count()
            
            if active_projects == 0:
                # Fallback to activity categories
                active_projects = ActivityLog.objects.filter(
                    timestamp__gte=last_30_days
                ).values('activity_type').distinct().count()
            
            return {
                'title': 'Active Projects',
                'value': str(active_projects),
                'icon': 'folder',
                'color': '#8B5CF6'
            }
    
    elif role == 'finance':
        if widget.name == 'monthly_budget':
            # Real budget calculations (you'll need to adjust based on your financial models)
            # This is a simplified example
            current_month = today.replace(day=1)
            
            # Total budget for current month (this should come from your budget model)
            # For now, let's calculate based on activities with financial impact
            financial_activities = ActivityLog.objects.filter(
                timestamp__gte=current_month,
                metadata__has_key='amount'
            )
            
            total_budgeted = Decimal('0.00')
            total_spent = Decimal('0.00')
            
            for activity in financial_activities:
                amount = activity.metadata.get('amount', 0)
                if isinstance(amount, (int, float, str)):
                    try:
                        amount_decimal = Decimal(str(amount))
                        if activity.activity_type == 'budget_allocation':
                            total_budgeted += amount_decimal
                        elif activity.activity_type == 'expense':
                            total_spent += amount_decimal
                    except (ValueError, TypeError):
                        continue
            
            utilization = 0
            if total_budgeted > 0:
                utilization = (total_spent / total_budgeted) * 100
            
            return {
                'title': 'Monthly Budget',
                'value': f'${total_spent:,.0f}',
                'subtitle': f'{utilization:.0f}% utilized',
                'icon': 'dollar-sign',
                'color': '#8B5CF6'
            }
            
        elif widget.name == 'pending_payments':
            # Real pending payments calculation
            pending_payments = ActivityLog.objects.filter(
                activity_type='payment_pending',
                timestamp__gte=last_30_days
            ).aggregate(
                total=Sum(
                    Case(
                        When(metadata__has_key='amount', then=F('metadata__amount')),
                        default=0,
                        output_field=IntegerField()
                    )
                )
            )['total'] or 0
            
            # Compare with last week
            last_week_pending = ActivityLog.objects.filter(
                activity_type='payment_pending',
                timestamp__gte=last_week,
                timestamp__lt=today
            ).count()
            
            this_week_pending = ActivityLog.objects.filter(
                activity_type='payment_pending',
                timestamp__gte=today - timedelta(days=7)
            ).count()
            
            change = 0
            if last_week_pending > 0:
                change = ((this_week_pending - last_week_pending) / last_week_pending) * 100
            
            return {
                'title': 'Pending Payments',
                'value': f'${pending_payments:,}',
                'change': Decimal(str(round(abs(change), 1))),
                'change_type': 'increase' if change >= 0 else 'decrease',
                'icon': 'credit-card',
                'color': '#EF4444' if pending_payments > 10000 else '#F59E0B'
            }
            
        elif widget.name == 'expense_summary':
            # Monthly expense summary
            current_month_expenses = ActivityLog.objects.filter(
                activity_type='expense',
                timestamp__gte=current_month,
                metadata__has_key='amount'
            ).aggregate(
                total=Sum(
                    Case(
                        When(metadata__has_key='amount', then=F('metadata__amount')),
                        default=0,
                        output_field=IntegerField()
                    )
                )
            )['total'] or 0
            
            return {
                'title': 'Monthly Expenses',
                'value': f'${current_month_expenses:,}',
                'icon': 'trending-down',
                'color': '#EF4444'
            }
    
    elif role in ['employee', 'procurement']:
        if widget.name == 'my_activities':
            # User's personal activity count
            user_activities_today = ActivityLog.objects.filter(
                user=user,
                timestamp__date=today
            ).count()
            
            user_activities_yesterday = ActivityLog.objects.filter(
                user=user,
                timestamp__date=yesterday
            ).count()
            
            change = user_activities_today - user_activities_yesterday
            
            return {
                'title': 'My Activities Today',
                'value': str(user_activities_today),
                'change': Decimal(str(abs(change))),
                'change_type': 'increase' if change >= 0 else 'decrease',
                'icon': 'activity',
                'color': '#3B82F6'
            }
            
        elif widget.name == 'my_pending_tasks':
            # User's pending tasks (based on activities)
            pending_tasks = ActivityLog.objects.filter(
                user=user,
                activity_type__in=['task_assigned', 'approval_required'],
                timestamp__gte=last_30_days
            ).count()
            
            return {
                'title': 'My Pending Tasks',
                'value': str(pending_tasks),
                'icon': 'check-circle',
                'color': '#F59E0B' if pending_tasks > 5 else '#10B981'
            }
    
    # Default fallback with real basic metrics
    total_activities = ActivityLog.objects.filter(
        timestamp__gte=last_30_days
    ).count()
    
    return {
        'title': widget.title or 'Activity Count',
        'value': str(total_activities),
        'icon': 'info',
        'color': '#6B7280'
    }

def get_chart_data(widget, user):
    """
    Generate chart data based on widget configuration and user role with real database queries
    """
    config = widget.config
    role = user.role
    today = timezone.now().date()
    
    if role in ['developer', 'admin'] and widget.name == 'user_registrations':
        # Real user registration data for last 7 days
        dates = []
        data = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            dates.append(date.strftime('%Y-%m-%d'))
            
            count = User.objects.filter(date_joined__date=date).count()
            data.append(count)
        
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
        
    elif role in ['developer', 'admin'] and widget.name == 'activity_trends':
        # Activity trends over last 7 days
        dates = []
        data = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            dates.append(date.strftime('%Y-%m-%d'))
            
            count = ActivityLog.objects.filter(timestamp__date=date).count()
            data.append(count)
        
        return {
            'chart_type': 'line',
            'labels': dates,
            'datasets': [{
                'label': 'Daily Activities',
                'data': data,
                'borderColor': '#10B981',
                'backgroundColor': 'rgba(16, 185, 129, 0.1)',
                'tension': 0.4
            }]
        }
    
    elif role == 'finance' and widget.name == 'expense_breakdown':
        # Real expense breakdown by activity type
        expense_data = ActivityLog.objects.filter(
            activity_type='expense',
            timestamp__gte=today - timedelta(days=30),
            metadata__has_key='category'
        ).values('metadata__category').annotate(
            total=Count('id')
        ).order_by('-total')[:4]
        
        if expense_data:
            labels = [item['metadata__category'] for item in expense_data]
            data = [item['total'] for item in expense_data]
            colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
        else:
            # Fallback to activity types
            activity_data = ActivityLog.objects.filter(
                timestamp__gte=today - timedelta(days=30)
            ).values('activity_type').annotate(
                total=Count('id')
            ).order_by('-total')[:4]
            
            labels = [item['activity_type'].replace('_', ' ').title() for item in activity_data]
            data = [item['total'] for item in activity_data]
            colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
        
        return {
            'chart_type': 'doughnut',
            'labels': labels,
            'datasets': [{
                'data': data,
                'backgroundColor': colors[:len(data)]
            }]
        }
        
    elif role == 'manager' and widget.name == 'team_activity':
        # Team activity over time
        dates = []
        completed_data = []
        pending_data = []
        
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            dates.append(date.strftime('%Y-%m-%d'))
            
            completed = ActivityLog.objects.filter(
                timestamp__date=date,
                activity_type='completed'
            ).count()
            completed_data.append(completed)
            
            pending = ActivityLog.objects.filter(
                timestamp__date=date,
                activity_type__in=['pending', 'approval_required']
            ).count()
            pending_data.append(pending)
        
        return {
            'chart_type': 'bar',
            'labels': dates,
            'datasets': [
                {
                    'label': 'Completed',
                    'data': completed_data,
                    'backgroundColor': '#10B981'
                },
                {
                    'label': 'Pending',
                    'data': pending_data,
                    'backgroundColor': '#F59E0B'
                }
            ]
        }
    
    # Default empty chart
    return {
        'chart_type': 'line',
        'labels': [],
        'datasets': []
    }

def get_table_data(widget, user):
    """
    Generate table data based on widget configuration and user role with real database queries
    """
    if user.role in ['developer', 'admin'] and widget.name == 'recent_users':
        # Real recent users data
        recent_users = User.objects.select_related().order_by('-date_joined')[:5]
        
        return {
            'headers': [
                {'key': 'name', 'label': 'Name'},
                {'key': 'email', 'label': 'Email'},
                {'key': 'role', 'label': 'Role'},
                {'key': 'date_joined', 'label': 'Joined'},
                {'key': 'is_active', 'label': 'Status'}
            ],
            'rows': [
                [
                    user.name or 'N/A',
                    user.email,
                    user.get_role_display(),
                    user.date_joined.strftime('%Y-%m-%d'),
                    'Active' if user.is_active else 'Inactive'
                ] for user in recent_users
            ]
        }
        
    elif user.role in ['developer', 'admin'] and widget.name == 'recent_activities':
        # Recent system activities
        recent_activities = ActivityLog.objects.select_related('user').order_by('-timestamp')[:5]
        
        return {
            'headers': [
                {'key': 'user', 'label': 'User'},
                {'key': 'activity', 'label': 'Activity'},
                {'key': 'timestamp', 'label': 'Time'},
                {'key': 'type', 'label': 'Type'}
            ],
            'rows': [
                [
                    activity.user.name if activity.user else 'System',
                    activity.title or activity.activity_type.replace('_', ' ').title(),
                    activity.timestamp.strftime('%Y-%m-%d %H:%M'),
                    activity.activity_type.replace('_', ' ').title()
                ] for activity in recent_activities
            ]
        }
        
    elif user.role == 'manager' and widget.name == 'team_summary':
        # Team member summary
        team_data = User.objects.filter(
            role__in=['employee', 'finance', 'procurement']
        ).annotate(
            activity_count=Count('activitylog', filter=Q(
                activitylog__timestamp__gte=timezone.now() - timedelta(days=7)
            ))
        )[:5]
        
        return {
            'headers': [
                {'key': 'name', 'label': 'Team Member'},
                {'key': 'role', 'label': 'Role'},
                {'key': 'activities', 'label': 'Week Activities'},
                {'key': 'status', 'label': 'Status'}
            ],
            'rows': [
                [
                    member.name or 'N/A',
                    member.get_role_display(),
                    str(member.activity_count),
                    'Active' if member.is_active else 'Inactive'
                ] for member in team_data
            ]
        }
        
    elif user.role == 'finance' and widget.name == 'recent_expenses':
        # Recent financial activities
        financial_activities = ActivityLog.objects.filter(
            activity_type__in=['expense', 'payment', 'budget_allocation'],
            metadata__has_key='amount'
        ).select_related('user').order_by('-timestamp')[:5]
        
        return {
            'headers': [
                {'key': 'type', 'label': 'Type'},
                {'key': 'amount', 'label': 'Amount'},
                {'key': 'user', 'label': 'User'},
                {'key': 'date', 'label': 'Date'}
            ],
            'rows': [
                [
                    activity.activity_type.replace('_', ' ').title(),
                    f"${activity.metadata.get('amount', 0):,}",
                    activity.user.name if activity.user else 'System',
                    activity.timestamp.strftime('%Y-%m-%d')
                ] for activity in financial_activities
            ]
        }
        
    elif widget.name == 'my_recent_activities':
        # User's personal recent activities
        user_activities = ActivityLog.objects.filter(
            user=user
        ).order_by('-timestamp')[:5]
        
        return {
            'headers': [
                {'key': 'activity', 'label': 'Activity'},
                {'key': 'type', 'label': 'Type'},
                {'key': 'timestamp', 'label': 'Time'}
            ],
            'rows': [
                [
                    activity.title or activity.activity_type.replace('_', ' ').title(),
                    activity.activity_type.replace('_', ' ').title(),
                    activity.timestamp.strftime('%Y-%m-%d %H:%M')
                ] for activity in user_activities
            ]
        }
    
    return {'headers': [], 'rows': []}


def get_progress_data(widget, user):
    """
    Generate progress data based on widget configuration and user role with real database queries
    """
    today = timezone.now().date()
    current_month = today.replace(day=1)
    
    if user.role == 'manager' and widget.name == 'monthly_goals':
        # Calculate progress based on completed activities
        total_activities = ActivityLog.objects.filter(
            timestamp__gte=current_month
        ).count()
        
        completed_activities = ActivityLog.objects.filter(
            timestamp__gte=current_month,
            activity_type='completed'
        ).count()
        
        # Set a target based on historical data or configuration
        target = widget.config.get('monthly_target', 100)
        if isinstance(target, str):
            try:
                target = int(target)
            except ValueError:
                target = 100
        
        percentage = 0
        if target > 0:
            percentage = min(100, (completed_activities / target) * 100)
        
        return {
            'title': 'Monthly Goals',
            'current': Decimal(str(completed_activities)),
            'target': Decimal(str(target)),
            'percentage': Decimal(str(round(percentage, 1))),
            'color': '#10B981' if percentage >= 80 else '#F59E0B' if percentage >= 60 else '#EF4444',
            'description': f'{"On track" if percentage >= 80 else "Behind schedule" if percentage < 60 else "Making progress"} - {completed_activities} of {target} completed'
        }
        
    elif user.role == 'finance' and widget.name == 'budget_utilization':
        # Budget utilization progress
        budgeted_amount = ActivityLog.objects.filter(
            activity_type='budget_allocation',
            timestamp__gte=current_month,
            metadata__has_key='amount'
        ).aggregate(
            total=Sum(
                Case(
                    When(metadata__has_key='amount', then=F('metadata__amount')),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total'] or 50000  # Default budget if none set
        
        spent_amount = ActivityLog.objects.filter(
            activity_type='expense',
            timestamp__gte=current_month,
            metadata__has_key='amount'
        ).aggregate(
            total=Sum(
                Case(
                    When(metadata__has_key='amount', then=F('metadata__amount')),
                    default=0,
                    output_field=IntegerField()
                )
                # dashboard/views.py - Continuation from budget_utilization

            )
        )['total'] or 0
        
        percentage = 0
        if budgeted_amount > 0:
            percentage = min(100, (spent_amount / budgeted_amount) * 100)
        
        return {
            'title': 'Budget Utilization',
            'current': Decimal(str(spent_amount)),
            'target': Decimal(str(budgeted_amount)),
            'percentage': Decimal(str(round(percentage, 1))),
            'color': '#10B981' if percentage <= 80 else '#F59E0B' if percentage <= 95 else '#EF4444',
            'description': f'${spent_amount:,} of ${budgeted_amount:,} budget used ({percentage:.1f}%)'
        }
        
    elif widget.name == 'project_completion':
        # Generic project completion based on activities
        # Calculate completion rate for user's activities
        user_total_activities = ActivityLog.objects.filter(
            user=user,
            timestamp__gte=current_month
        ).count()
        
        user_completed_activities = ActivityLog.objects.filter(
            user=user,
            timestamp__gte=current_month,
            activity_type='completed'
        ).count()
        
        target = widget.config.get('target', user_total_activities if user_total_activities > 0 else 10)
        if isinstance(target, str):
            try:
                target = int(target)
            except ValueError:
                target = user_total_activities if user_total_activities > 0 else 10
        
        percentage = 0
        if target > 0:
            percentage = min(100, (user_completed_activities / target) * 100)
        
        return {
            'title': 'Task Completion',
            'current': Decimal(str(user_completed_activities)),
            'target': Decimal(str(target)),
            'percentage': Decimal(str(round(percentage, 1))),
            'color': '#8B5CF6',
            'description': f'{user_completed_activities} of {target} tasks completed'
        }
    
    # Default progress data
    return {
        'title': 'Progress',
        'current': Decimal('0'),
        'target': Decimal('100'),
        'percentage': Decimal('0'),
        'color': '#6B7280',
        'description': 'No data available'
    }
    
def calculate_metric_value(metric, user):
    """
    Calculate real metric values based on database data
    """
    today = timezone.now().date()
    last_30_days = today - timedelta(days=30)
    last_7_days = today - timedelta(days=7)
    
    metric_key = metric.key
    
    if metric_key == 'total_users':
        total = User.objects.count()
        active = User.objects.filter(is_active=True).count()
        new_this_month = User.objects.filter(date_joined__gte=last_30_days).count()
        
        return {
            'value': total,
            'formatted_value': f'{total:,}',
            'additional_info': {
                'active_users': active,
                'new_this_month': new_this_month,
                'inactive_users': total - active
            }
        }
        
    elif metric_key == 'daily_active_users':
        active_today = User.objects.filter(
            activitylog__timestamp__date=today
        ).distinct().count()
        
        active_week = User.objects.filter(
            activitylog__timestamp__gte=last_7_days
        ).distinct().count()
        
        return {
            'value': active_today,
            'formatted_value': str(active_today),
            'additional_info': {
                'active_this_week': active_week,
                'trend': 'up' if active_today > 0 else 'stable'
            }
        }
        
    elif metric_key == 'system_alerts':
        total_alerts = SystemAlert.objects.filter(is_active=True).count()
        critical_alerts = SystemAlert.objects.filter(
            is_active=True, 
            alert_type='error'
        ).count()
        warning_alerts = SystemAlert.objects.filter(
            is_active=True, 
            alert_type='warning'
        ).count()
        
        return {
            'value': total_alerts,
            'formatted_value': str(total_alerts),
            'additional_info': {
                'critical': critical_alerts,
                'warnings': warning_alerts,
                'info': total_alerts - critical_alerts - warning_alerts
            }
        }
        
    elif metric_key == 'pending_approvals':
        # Count activities requiring approval
        pending_count = ActivityLog.objects.filter(
            activity_type='approval_required',
            timestamp__gte=last_30_days
        ).count()
        
        # Count by priority if metadata available
        high_priority = ActivityLog.objects.filter(
            activity_type='approval_required',
            timestamp__gte=last_30_days,
            metadata__priority='high'
        ).count()
        
        return {
            'value': pending_count,
            'formatted_value': str(pending_count),
            'additional_info': {
                'high_priority': high_priority,
                'normal_priority': pending_count - high_priority,
                'overdue': 0  # Would need additional logic for overdue items
            }
        }
        
    elif metric_key == 'monthly_expenses':
        current_month = today.replace(day=1)
        
        # Calculate total expenses for current month
        monthly_total = ActivityLog.objects.filter(
            activity_type='expense',
            timestamp__gte=current_month,
            metadata__has_key='amount'
        ).aggregate(
            total=Sum(
                Case(
                    When(metadata__has_key='amount', then=F('metadata__amount')),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )['total'] or 0
        
        # Calculate by category
        categories = ActivityLog.objects.filter(
            activity_type='expense',
            timestamp__gte=current_month,
            metadata__has_key='category'
        ).values('metadata__category').annotate(
            total=Sum(
                Case(
                    When(metadata__has_key='amount', then=F('metadata__amount')),
                    default=0,
                    output_field=IntegerField()
                )
            )
        )
        
        return {
            'value': monthly_total,
            'formatted_value': f'${monthly_total:,}',
            'additional_info': {
                'by_category': {cat['metadata__category']: cat['total'] for cat in categories},
                'currency': 'USD'
            }
        }
        
    elif metric_key == 'user_activity_rate':
        # Calculate user engagement rate
        total_users = User.objects.filter(is_active=True).count()
        active_users = User.objects.filter(
            activitylog__timestamp__gte=last_7_days
        ).distinct().count()
        
        rate = 0
        if total_users > 0:
            rate = (active_users / total_users) * 100
        
        return {
            'value': round(rate, 1),
            'formatted_value': f'{rate:.1f}%',
            'additional_info': {
                'active_users': active_users,
                'total_users': total_users,
                'inactive_users': total_users - active_users
            }
        }
    
    # Default metric calculation
    activity_count = ActivityLog.objects.filter(
        timestamp__gte=last_30_days
    ).count()
    
    return {
        'value': activity_count,
        'formatted_value': str(activity_count),
        'additional_info': {}
    }

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_metric_data(request, metric_id):
    """
    Get specific metric data with real database queries
    """
    try:
        metric = DashboardMetric.objects.get(id=metric_id)
        user = request.user
        
        # Check if user has access to this metric
        if metric.roles and user.role not in metric.roles:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate real metric data based on metric key
        data = calculate_metric_value(metric, user)
        
        return Response({
            'metric': DashboardMetricSerializer(metric).data,
            'data': data
        })
        
    except DashboardMetric.DoesNotExist:
        return Response(
            {'error': 'Metric not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_widget_data_endpoint(request, widget_id):
    """
    Get specific widget data by widget ID
    """
    try:
        widget = DashboardWidget.objects.get(id=widget_id)
        user = request.user
        
        # Check if user has access to this widget based on role
        if widget.roles and user.role not in widget.roles:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if widget is active
        if not widget.is_active:
            return Response(
                {'error': 'Widget is not active'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get widget data using existing helper function
        widget_data = get_widget_data(widget, user)
        
        return Response(widget_data)
        
    except DashboardWidget.DoesNotExist:
        return Response(
            {'error': 'Widget not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dismiss_alert(request, alert_id):
    """
    Dismiss an alert for the current user
    """
    try:
        alert = SystemAlert.objects.get(id=alert_id)
        user = request.user
        
        # Check if user has access to this alert
        if alert.roles and user.role not in alert.roles:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create or update dismissal status
        alert_status, created = UserAlertStatus.objects.get_or_create(
            user=user,
            alert=alert,
            defaults={'is_dismissed': True, 'dismissed_at': timezone.now()}
        )
        
        if not created:
            alert_status.is_dismissed = True
            alert_status.dismissed_at = timezone.now()
            alert_status.save()
        
        # Log the dismissal
        ActivityLog.objects.create(
            user=user,
            activity_type='alert_dismissed',
            title=f'Dismissed alert: {alert.title}',
            metadata={'alert_id': alert_id, 'alert_type': alert.alert_type}
        )
        
        return Response({'message': 'Alert dismissed successfully'})
        
    except SystemAlert.DoesNotExist:
        return Response(
            {'error': 'Alert not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_dashboard_layout(request):
    """
    Update user's dashboard layout configuration
    """
    user = request.user
    layout_data = request.data.get('layout', {})
    
    try:
        layout, created = DashboardLayout.objects.get_or_create(user=user)
        
        # Update layout configuration
        if 'widget_positions' in layout_data:
            layout.widget_positions = layout_data['widget_positions']
        
        if 'hidden_widgets' in layout_data:
            layout.hidden_widgets = layout_data['hidden_widgets']
        
        if 'custom_settings' in layout_data:
            layout.custom_settings = layout_data['custom_settings']
        
        layout.updated_at = timezone.now()
        layout.save()
        
        # Log the layout update
        ActivityLog.objects.create(
            user=user,
            activity_type='dashboard_customized',
            title='Updated dashboard layout',
            metadata={'layout_changes': layout_data}
        )
        
        return Response({
            'message': 'Dashboard layout updated successfully',
            'layout': DashboardLayoutSerializer(layout).data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to update layout: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_insights(request):
    """
    Get dashboard insights and analytics with real data
    """
    user = request.user
    today = timezone.now().date()
    last_30_days = today - timedelta(days=30)
    last_7_days = today - timedelta(days=7)
    
    insights = {}
    
    if user.role in ['developer', 'admin']:
        # System-wide insights
        insights = {
            'user_growth': calculate_user_growth_trend(last_30_days),
            'activity_patterns': calculate_activity_patterns(last_30_days),
            'system_health': calculate_system_health_metrics(),
            'popular_features': get_popular_features(last_30_days),
        }
        
    elif user.role == 'manager':
        # Management insights
        insights = {
            'team_productivity': calculate_team_productivity(last_30_days),
            'approval_bottlenecks': identify_approval_bottlenecks(last_30_days),
            'workload_distribution': calculate_workload_distribution(last_30_days),
            'performance_trends': calculate_performance_trends(last_30_days),
        }
        
    elif user.role == 'finance':
        # Financial insights
        insights = {
            'spending_trends': calculate_spending_trends(last_30_days),
            'budget_variance': calculate_budget_variance(),
            'expense_patterns': analyze_expense_patterns(last_30_days),
            'cost_optimization': identify_cost_optimization_opportunities(last_30_days),
        }
        
    else:
        # Personal insights
        insights = {
            'personal_productivity': calculate_personal_productivity(user, last_30_days),
            'activity_summary': get_personal_activity_summary(user, last_30_days),
            'goal_progress': calculate_personal_goal_progress(user, last_30_days),
        }
    
    return Response({'insights': insights})

def calculate_user_growth_trend(since_date):
    """Calculate user registration growth trend"""
    daily_registrations = User.objects.filter(
        date_joined__gte=since_date
    ).extra(
        select={'day': 'DATE(date_joined)'}
    ).values('day').annotate(
        count=Count('id')
    ).order_by('day')
    
    total_growth = sum(day['count'] for day in daily_registrations)
    avg_daily = total_growth / 30 if total_growth > 0 else 0
    
    return {
        'total_new_users': total_growth,
        'average_daily': round(avg_daily, 1),
        'daily_breakdown': list(daily_registrations),
        'trend': 'increasing' if total_growth > 0 else 'stable'
    }

def calculate_activity_patterns(since_date):
    """Analyze activity patterns"""
    hourly_activity = ActivityLog.objects.filter(
        timestamp__gte=since_date
    ).extra(
        select={'hour': 'EXTRACT(hour FROM timestamp)'}
    ).values('hour').annotate(
        count=Count('id')
    ).order_by('hour')
    
    peak_hour = max(hourly_activity, key=lambda x: x['count'])['hour'] if hourly_activity else 0
    
    return {
        'peak_hour': int(peak_hour),
        'hourly_distribution': list(hourly_activity),
        'total_activities': sum(h['count'] for h in hourly_activity)
    }

def calculate_system_health_metrics():
    """Calculate system health indicators"""
    error_count = SystemAlert.objects.filter(
        alert_type='error',
        is_active=True
    ).count()
    
    warning_count = SystemAlert.objects.filter(
        alert_type='warning',
        is_active=True
    ).count()
    
    health_score = max(0, 100 - (error_count * 10) - (warning_count * 5))
    
    return {
        'health_score': health_score,
        'error_alerts': error_count,
        'warning_alerts': warning_count,
        'status': 'healthy' if health_score > 80 else 'warning' if health_score > 60 else 'critical'
    }

def get_popular_features(since_date):
    """Identify most used features"""
    feature_usage = ActivityLog.objects.filter(
        timestamp__gte=since_date
    ).values('activity_type').annotate(
        usage_count=Count('id')
    ).order_by('-usage_count')[:5]
    
    return [
        {
            'feature': item['activity_type'].replace('_', ' ').title(),
            'usage_count': item['usage_count']
        } for item in feature_usage
    ]

def calculate_team_productivity(since_date):
    """Calculate team productivity metrics"""
    completed_tasks = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='completed'
    ).count()
    
    total_tasks = ActivityLog.objects.filter(
        timestamp__gte=since_date
    ).count()
    
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    return {
        'completion_rate': round(completion_rate, 1),
        'completed_tasks': completed_tasks,
        'total_tasks': total_tasks,
        'productivity_score': min(100, completion_rate)
    }

def identify_approval_bottlenecks(since_date):
    """Identify approval process bottlenecks"""
    pending_approvals = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='approval_required'
    )
    
    # Group by type if metadata available
    bottlenecks = pending_approvals.values('metadata__type').annotate(
        count=Count('id')
    ).order_by('-count') if pending_approvals.exists() else []
    
    return {
        'total_pending': pending_approvals.count(),
        'bottleneck_areas': list(bottlenecks)[:3],
        'average_pending_time': 2.5  # Would calculate from actual timestamps
    }

def calculate_workload_distribution(since_date):
    """Calculate workload distribution across team"""
    user_workload = ActivityLog.objects.filter(
        timestamp__gte=since_date
    ).values('user__name', 'user__role').annotate(
        task_count=Count('id')
    ).order_by('-task_count')[:10]
    
    return {
        'distribution': list(user_workload),
        'total_users_active': len(user_workload)
    }

def calculate_performance_trends(since_date):
    """Calculate team performance trends"""
    weekly_performance = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='completed'
    ).extra(
        select={'week': 'EXTRACT(week FROM timestamp)'}
    ).values('week').annotate(
        completed=Count('id')
    ).order_by('week')
    
    return {
        'weekly_trends': list(weekly_performance),
        'trend_direction': 'up' if len(weekly_performance) > 1 and 
        weekly_performance[-1]['completed'] > weekly_performance[0]['completed'] else 'stable'
    }

def calculate_spending_trends(since_date):
    """Calculate financial spending trends"""
    daily_expenses = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='expense',
        metadata__has_key='amount'
    ).extra(
        select={'day': 'DATE(timestamp)'}
    ).values('day').annotate(
        total=Sum(
            Case(
                When(metadata__has_key='amount', then=F('metadata__amount')),
                default=0,
                output_field=IntegerField()
            )
        )
    ).order_by('day')
    
    total_spent = sum(day['total'] for day in daily_expenses)
    
    return {
        'total_spending': total_spent,
        'daily_breakdown': list(daily_expenses),
        'average_daily': total_spent / 30 if total_spent > 0 else 0
    }

def calculate_budget_variance():
    """Calculate budget vs actual variance"""
    current_month = timezone.now().date().replace(day=1)
    
    budgeted = ActivityLog.objects.filter(
        timestamp__gte=current_month,
        activity_type='budget_allocation',
        metadata__has_key='amount'
    ).aggregate(
        total=Sum(
            Case(
                When(metadata__has_key='amount', then=F('metadata__amount')),
                default=0,
                output_field=IntegerField()
            )
        )
    )['total'] or 50000
    
    actual = ActivityLog.objects.filter(
        timestamp__gte=current_month,
        activity_type='expense',
        metadata__has_key='amount'
    ).aggregate(
        total=Sum(
            Case(
                When(metadata__has_key='amount', then=F('metadata__amount')),
                default=0,
                output_field=IntegerField()
            )
        )
    )['total'] or 0
    
    variance = budgeted - actual
    variance_percent = (variance / budgeted * 100) if budgeted > 0 else 0
    
    return {
        'budgeted_amount': budgeted,
        'actual_spending': actual,
        'variance': variance,
        'variance_percent': round(variance_percent, 1),
        'status': 'under_budget' if variance > 0 else 'over_budget'
    }

def analyze_expense_patterns(since_date):
    """Analyze expense patterns by category"""
    expense_categories = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='expense',
        metadata__has_key='category'
    ).values('metadata__category').annotate(
        total=Sum(
            Case(
                When(metadata__has_key='amount', then=F('metadata__amount')),
                default=0,
                output_field=IntegerField()
            )
        ),
        count=Count('id')
    ).order_by('-total')
    
    return {
        'by_category': list(expense_categories),
        'top_category': expense_categories[0]['metadata__category'] if expense_categories else None
    }

def identify_cost_optimization_opportunities(since_date):
    """Identify potential cost savings"""
    high_frequency_low_amount = ActivityLog.objects.filter(
        timestamp__gte=since_date,
        activity_type='expense',
        metadata__has_key='amount'
    ).values('metadata__category').annotate(
        count=Count('id'),
        avg_amount=Avg(
            Case(
                When(metadata__has_key='amount', then=F('metadata__amount')),
                default=0,
                output_field=IntegerField()
            )
        )
    ).filter(count__gt=10, avg_amount__lt=100)
    
    return {
        'bulk_purchase_opportunities': list(high_frequency_low_amount),
        'potential_savings': sum(item['count'] * item['avg_amount'] * 0.1 for item in high_frequency_low_amount)
    }

def calculate_personal_productivity(user, since_date):
    """Calculate individual user productivity"""
    user_activities = ActivityLog.objects.filter(
        user=user,
        timestamp__gte=since_date
    )
    
    completed = user_activities.filter(activity_type='completed').count()
    total = user_activities.count()
    
    productivity_score = (completed / total * 100) if total > 0 else 0
    
    return {
        'productivity_score': round(productivity_score, 1),
        'completed_tasks': completed,
        'total_activities': total,
        'completion_rate': round(productivity_score, 1)
    }

def get_personal_activity_summary(user, since_date):
    """Get personal activity summary"""
    activities = ActivityLog.objects.filter(
        user=user,
        timestamp__gte=since_date
    ).values('activity_type').annotate(
        count=Count('id')
    ).order_by('-count')
    
    return {
        'total_activities': sum(a['count'] for a in activities),
        'activity_breakdown': list(activities),
        'most_common_activity': activities[0]['activity_type'] if activities else None
    }

def calculate_personal_goal_progress(user, since_date):
    """Calculate progress toward personal goals"""
    completed_this_month = ActivityLog.objects.filter(
        user=user,
        timestamp__gte=since_date,
        activity_type='completed'
    ).count()
    
    # Assume a target of 30 completed tasks per month (could be configurable)
    target = 30
    progress = min(100, (completed_this_month / target * 100))
    
    return {
        'current_progress': completed_this_month,
        'target': target,
        'progress_percentage': round(progress, 1),
        'on_track': progress >= 70
    }
    
    # Insert these functions at the END of your views.py file, before any existing function definitions

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def log_activity(request):
    """
    Log a new activity for the current user
    """
    try:
        activity_type = request.GET.get('type', 'general')
        title = request.GET.get('title', 'User Activity')
        description = request.GET.get('description', '')
        metadata = request.GET.get('metadata', {})
        
        # Parse metadata if it's a string
        if isinstance(metadata, str):
            try:
                import json
                metadata = json.loads(metadata)
            except json.JSONDecodeError:
                metadata = {}
        
        activity = ActivityLog.objects.create(
            user=request.user,
            activity_type=activity_type,
            title=title,
            description=description,
            metadata=metadata,
            timestamp=timezone.now()
        )
        
        return Response({
            'message': 'Activity logged successfully',
            'activity': ActivityLogSerializer(activity).data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to log activity: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated, RoleBasedPermission])
def admin_dashboard(request):
    """
    Admin-specific dashboard view
    """
    if request.user.role not in ['admin', 'developer']:
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get admin-specific data
    admin_data = {
        'user_management': {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'recent_registrations': User.objects.filter(
                date_joined__gte=timezone.now() - timedelta(days=7)
            ).count(),
        },
        'system_status': {
            'active_alerts': SystemAlert.objects.filter(is_active=True).count(),
            'error_alerts': SystemAlert.objects.filter(
                is_active=True, alert_type='error'
            ).count(),
        },
        'activity_stats': {
            'total_activities': ActivityLog.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).count(),
            'daily_average': ActivityLog.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count() / 7,
        }
    }
    
    return Response(admin_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, RoleBasedPermission])
def manager_dashboard(request):
    """
    Manager-specific dashboard view
    """
    if request.user.role != 'manager':
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get manager-specific data
    manager_data = {
        'team_overview': {
            'team_size': User.objects.filter(
                role__in=['employee', 'finance', 'procurement']
            ).count(),
            'active_team_members': User.objects.filter(
                role__in=['employee', 'finance', 'procurement'],
                is_active=True
            ).count(),
        },
        'pending_items': {
            'approvals_needed': ActivityLog.objects.filter(
                activity_type='approval_required',
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).count(),
        },
        'performance_metrics': {
            'completed_tasks': ActivityLog.objects.filter(
                activity_type='completed',
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count(),
        }
    }
    
    return Response(manager_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, RoleBasedPermission])
def finance_dashboard(request):
    """
    Finance-specific dashboard view
    """
    if request.user.role != 'finance':
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    current_month = timezone.now().date().replace(day=1)
    
    # Get finance-specific data
    finance_data = {
        'budget_overview': {
            'monthly_budget': ActivityLog.objects.filter(
                activity_type='budget_allocation',
                timestamp__gte=current_month,
                metadata__has_key='amount'
            ).aggregate(
                total=Sum('metadata__amount')
            )['total'] or 0,
            'monthly_expenses': ActivityLog.objects.filter(
                activity_type='expense',
                timestamp__gte=current_month,
                metadata__has_key='amount'
            ).aggregate(
                total=Sum('metadata__amount')
            )['total'] or 0,
        },
        'pending_payments': {
            'count': ActivityLog.objects.filter(
                activity_type='payment_pending',
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).count(),
        },
        'recent_transactions': {
            'count': ActivityLog.objects.filter(
                activity_type__in=['expense', 'payment', 'budget_allocation'],
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).count(),
        }
    }
    
    return Response(finance_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_dashboard(request):
    """
    Employee-specific dashboard view
    """
    if request.user.role not in ['employee', 'procurement']:
        return Response(
            {'error': 'Access denied'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get employee-specific data
    employee_data = {
        'personal_stats': {
            'my_activities_today': ActivityLog.objects.filter(
                user=request.user,
                timestamp__date=timezone.now().date()
            ).count(),
            'my_pending_tasks': ActivityLog.objects.filter(
                user=request.user,
                activity_type__in=['task_assigned', 'approval_required'],
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).count(),
        },
        'recent_activities': ActivityLogSerializer(
            ActivityLog.objects.filter(
                user=request.user
            ).order_by('-timestamp')[:5],
            many=True
        ).data,
    }
    
    return Response(employee_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def system_health_check(request):
    """
    System health check endpoint
    """
    try:
        # Check database connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Get system metrics
        health_data = {
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'checks': {
                'database': 'ok',
                'active_alerts': SystemAlert.objects.filter(
                    is_active=True, alert_type='error'
                ).count(),
                'recent_activities': ActivityLog.objects.filter(
                    timestamp__gte=timezone.now() - timedelta(hours=1)
                ).count(),
            },
            'system_info': {
                'total_users': User.objects.count(),
                'active_users': User.objects.filter(is_active=True).count(),
                'total_activities': ActivityLog.objects.count(),
            }
        }
        
        # Determine overall health status
        if health_data['checks']['active_alerts'] > 5:
            health_data['status'] = 'warning'
        if health_data['checks']['active_alerts'] > 10:
            health_data['status'] = 'critical'
        
        return Response(health_data)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """
    Get notifications for the current user
    """
    user = request.user
    
    # Get active alerts for user's role
    alerts = SystemAlert.objects.filter(
        (Q(roles__contains=[user.role]) | Q(roles=[])) &
        (Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())),
        is_active=True
    ).exclude(
        useralertstatus__user=user,
        useralertstatus__is_dismissed=True
    ).order_by('-priority', '-created_at')
    
    # Get recent activities that might be notifications
    recent_activities = ActivityLog.objects.filter(
        user=user,
        activity_type__in=['task_assigned', 'approval_required', 'system_notification'],
        timestamp__gte=timezone.now() - timedelta(days=7)
    ).order_by('-timestamp')[:10]
    
    notifications = {
        'alerts': SystemAlertSerializer(alerts, many=True).data,
        'activities': ActivityLogSerializer(recent_activities, many=True).data,
        'unread_count': alerts.count(),
    }
    
    return Response(notifications)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """
    Mark a notification as read
    """
    try:
        # This could be either an alert or activity
        notification_type = request.data.get('type', 'alert')
        
        if notification_type == 'alert':
            alert = SystemAlert.objects.get(id=notification_id)
            alert_status, created = UserAlertStatus.objects.get_or_create(
                user=request.user,
                alert=alert,
                defaults={'is_read': True, 'read_at': timezone.now()}
            )
            
            if not created:
                alert_status.is_read = True
                alert_status.read_at = timezone.now()
                alert_status.save()
        
        return Response({'message': 'Notification marked as read'})
        
    except (SystemAlert.DoesNotExist, ActivityLog.DoesNotExist):
        return Response(
            {'error': 'Notification not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quick_actions(request):
    """
    Get quick actions available to the current user
    """
    user = request.user
    
    # Get role-specific quick actions
    quick_actions = QuickAction.objects.filter(
        Q(roles__contains=[user.role]) | Q(roles=[]),
        is_active=True
    ).order_by('order')
    
    # Filter by permissions
    filtered_actions = []
    for action in quick_actions:
        if action.requires_permission:
            # Check if user has the required permission
            if hasattr(user, action.requires_permission) and getattr(user, action.requires_permission)():
                filtered_actions.append(action)
        else:
            filtered_actions.append(action)
    
    return Response({
        'quick_actions': QuickActionSerializer(filtered_actions, many=True).data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def execute_quick_action(request, action_id):
    """
    Execute a quick action
    """
    try:
        action = QuickAction.objects.get(id=action_id)
        user = request.user
        
        # Check permissions
        if action.roles and user.role not in action.roles:
            return Response(
                {'error': 'Access denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if action.requires_permission:
            if not (hasattr(user, action.requires_permission) and getattr(user, action.requires_permission)()):
                return Response(
                    {'error': 'Insufficient permissions'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Log the action execution
        ActivityLog.objects.create(
            user=user,
            activity_type='quick_action_executed',
            title=f'Executed quick action: {action.name}',
            metadata={
                'action_id': action_id,
                'action_name': action.name,
                'action_type': action.action_type
            }
        )
        
        # Execute the action based on type
        result = {}
        if action.action_type == 'navigate':
            result = {'redirect_url': action.config.get('url', '/')}
        elif action.action_type == 'api_call':
            result = {'message': f'API call executed: {action.name}'}
        elif action.action_type == 'modal':
            result = {'modal_config': action.config}
        else:
            result = {'message': f'Action executed: {action.name}'}
        
        return Response({
            'message': 'Quick action executed successfully',
            'result': result
        })
        
    except QuickAction.DoesNotExist:
        return Response(
            {'error': 'Quick action not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_dashboard_data(request, format):
    """
    Export dashboard data in specified format
    """
    user = request.user
    
    if format not in ['json', 'csv', 'pdf']:
        return Response(
            {'error': 'Unsupported format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get dashboard data
        dashboard_data = dashboard_overview(request).data
        
        if format == 'json':
            from django.http import JsonResponse
            response = JsonResponse(dashboard_data)
            response['Content-Disposition'] = 'attachment; filename="dashboard_data.json"'
            return response
            
        elif format == 'csv':
            import csv
            from django.http import HttpResponse
            
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="dashboard_data.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Metric', 'Value', 'Type'])
            
            # Write metrics data
            for metric in dashboard_data.get('metrics', []):
                writer.writerow([
                    metric.get('display_name', ''),
                    metric.get('value', ''),
                    metric.get('category', '')
                ])
            
            return response
            
        else:  # PDF format
            return Response({
                'message': 'PDF export not implemented yet',
                'available_formats': ['json', 'csv']
            })
            
    except Exception as e:
        return Response(
            {'error': f'Export failed: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_live_statistics(request):
    """
    Get real-time statistics for the dashboard
    """
    user = request.user
    now = timezone.now()
    
    # Base statistics available to all users
    stats = {
        'timestamp': now.isoformat(),
        'my_activity_count': ActivityLog.objects.filter(
            user=user,
            timestamp__date=now.date()
        ).count(),
        'system_time': now.strftime('%H:%M:%S'),
    }
    
    # Role-specific live stats
    if user.role in ['admin', 'developer']:
        stats.update({
            'active_users_now': User.objects.filter(
                activitylog__timestamp__gte=now - timedelta(minutes=15)
            ).distinct().count(),
            'recent_activities': ActivityLog.objects.filter(
                timestamp__gte=now - timedelta(minutes=5)
            ).count(),
            'active_alerts': SystemAlert.objects.filter(
                is_active=True
            ).count(),
        })
        
    elif user.role == 'manager':
        stats.update({
            'team_active_now': User.objects.filter(
                role__in=['employee', 'finance', 'procurement'],
                activitylog__timestamp__gte=now - timedelta(minutes=30)
            ).distinct().count(),
            'pending_approvals': ActivityLog.objects.filter(
                activity_type='approval_required',
                timestamp__gte=now - timedelta(days=1)
            ).count(),
        })
        
    elif user.role == 'finance':
        stats.update({
            'pending_payments': ActivityLog.objects.filter(
                activity_type='payment_pending',
                timestamp__gte=now - timedelta(days=7)
            ).count(),
            'daily_expenses': ActivityLog.objects.filter(
                activity_type='expense',
                timestamp__date=now.date()
            ).aggregate(
                total=Sum('metadata__amount')
            )['total'] or 0,
        })
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_activity_feed(request):
    """
    Get real-time activity feed
    """
    user = request.user
    limit = int(request.GET.get('limit', 20))
    
    # Get activities based on user role
    if user.role in ['admin', 'developer']:
        # Admins see all activities
        activities = ActivityLog.objects.all()
    elif user.role == 'manager':
        # Managers see team activities
        activities = ActivityLog.objects.filter(
            Q(user__role__in=['employee', 'finance', 'procurement']) |
            Q(user=user)
        )
    else:
        # Regular users see their own activities
        activities = ActivityLog.objects.filter(user=user)
    
    # Apply filters
    activity_type = request.GET.get('type')
    if activity_type:
        activities = activities.filter(activity_type=activity_type)
    
    # Get recent activities
    recent_activities = activities.select_related('user').order_by('-timestamp')[:limit]
    
    return Response({
        'activities': ActivityLogSerializer(recent_activities, many=True).data,
        'total_count': activities.count(),
        'last_updated': timezone.now().isoformat()
    })