from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Main dashboard routes
    path('overview/', views.dashboard_overview, name='dashboard-overview'),
    
    # Metric-related endpoints
    path('metrics/<int:metric_id>/', views.get_metric_data, name='get-metric-data'),
    
    # Alert management
    path('alerts/<int:alert_id>/dismiss/', views.dismiss_alert, name='dismiss-alert'),
    
    # Dashboard customization
    path('layout/update/', views.update_dashboard_layout, name='update-dashboard-layout'),
    
    # Analytics and insights
    path('insights/', views.get_dashboard_insights, name='dashboard-insights'),
    
    # Widget data endpoints (if you want individual widget endpoints)
    path('widgets/<int:widget_id>/data/', views.get_widget_data_endpoint, name='get-widget-data'),
    
    # Activity logging endpoint (if you want to expose it)
    path('activities/log/', views.log_activity, name='log-activity'),
    
    # Role-specific dashboard views (optional alternative endpoints)
    path('admin/', views.admin_dashboard, name='admin-dashboard'),
    path('manager/', views.manager_dashboard, name='manager-dashboard'),
    path('finance/', views.finance_dashboard, name='finance-dashboard'),
    path('employee/', views.employee_dashboard, name='employee-dashboard'),
    
    # Additional utility endpoints
    path('health/', views.system_health_check, name='system-health'),
    path('notifications/', views.get_user_notifications, name='user-notifications'),
    path('notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark-notification-read'),
    
    # Quick actions endpoints
    path('quick-actions/', views.get_quick_actions, name='get-quick-actions'),
    path('quick-actions/<int:action_id>/execute/', views.execute_quick_action, name='execute-quick-action'),
    
    # Dashboard export functionality
    path('export/<str:format>/', views.export_dashboard_data, name='export-dashboard'),
    
    # Real-time data endpoints
    path('live-stats/', views.get_live_statistics, name='live-statistics'),
    path('activity-feed/', views.get_activity_feed, name='activity-feed'),
]