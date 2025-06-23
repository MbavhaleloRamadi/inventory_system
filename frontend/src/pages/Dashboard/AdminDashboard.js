// src/components/Dashboard/AdminDashboard.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  AlertTriangle,
  Activity,
  Shield,
  Settings,
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Eye,
  UserPlus,
  BarChart3,
  Zap,
  Download
} from 'lucide-react';
// Removed: import { dashboardAPI } from '../../services/api';
// Removed: import toast from 'react-hot-toast';

const AdminDashboard = ({ user }) => {
  // Initialize with static/mock data instead of empty state
  const [data] = useState({
    metrics: {
      totalUsers: 0,
      totalOrganizations: 0,
      enabledModules: 0,
      systemHealth: 95,
      lowStockAlerts: 0,
      pendingRequests: 0,
      inventoryActivity: 0
    },
    recentActivity: [],
    systemAlerts: [],
    userStats: {},
    moduleUsage: [],
    branchStats: []
  });
  
  // Removed: const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // REMOVED: fetchAdminData function that made API calls
  // const fetchAdminData = useCallback(async () => {
  //   try {
  //     setLoading(true);
  //     const response = await dashboardAPI.getDashboardData();
  //     // ... API call logic removed
  //   } catch (error) {
  //     console.error('Error fetching admin data:', error);
  //     toast.error('Failed to load admin data');
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // }, [refreshing]);

  // REMOVED: useEffect hook that triggered API calls
  // useEffect(() => {
  //   fetchAdminData();
  // }, [fetchAdminData]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Removed: fetchAdminData();
    // Instead, just reset refreshing state after a delay to simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'system': return <Database className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'module': return <Zap className="h-4 w-4" />;
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-600';
      case 'system': return 'bg-green-100 text-green-600';
      case 'security': return 'bg-red-100 text-red-600';
      case 'module': return 'bg-purple-100 text-purple-600';
      case 'success': return 'bg-green-100 text-green-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'error': return <XCircle className="h-5 w-5" />;
      case 'success': return <CheckCircle className="h-5 w-5" />;
      case 'info': return <Bell className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const calculateMetricChange = (current, previous) => {
    if (!previous || previous === 0) return '+0%';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return change >= 0 ? `+${change}%` : `${change}%`;
  };

  const getSystemHealthStatus = (health) => {
    if (health >= 95) return { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', status: 'Excellent' };
    if (health >= 80) return { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', status: 'Good' };
    return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', status: 'Needs Attention' };
  };

  // Removed loading state check since we're not loading from API
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="flex flex-col items-center gap-4">
  //         <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
  //         <p className="text-gray-600">Loading admin dashboard...</p>
  //       </div>
  //     </div>
  //   );
  // }

  const healthStatus = getSystemHealthStatus(data.metrics.systemHealth || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">System overview and management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* System Health Status Indicator */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${healthStatus.bgColor}`}>
                <healthStatus.icon className={`h-4 w-4 ${healthStatus.color}`} />
                <span className={`text-sm font-medium ${healthStatus.color}`}>
                  System {healthStatus.status}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* High-Level Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              label: 'Total Users',
              value: data.metrics.totalUsers || 0,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              change: calculateMetricChange(data.metrics.totalUsers, data.metrics.previousUsers),
              changeType: (data.metrics.totalUsers || 0) >= (data.metrics.previousUsers || 0) ? 'increase' : 'decrease'
            },
            {
              icon: Building,
              label: 'Organizations',
              value: data.metrics.totalOrganizations || 0,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              change: calculateMetricChange(data.metrics.totalOrganizations, data.metrics.previousOrganizations),
              changeType: (data.metrics.totalOrganizations || 0) >= (data.metrics.previousOrganizations || 0) ? 'increase' : 'decrease'
            },
            {
              icon: Zap,
              label: 'Active Modules',
              value: data.metrics.enabledModules || 0,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              change: calculateMetricChange(data.metrics.enabledModules, data.metrics.previousModules),
              changeType: (data.metrics.enabledModules || 0) >= (data.metrics.previousModules || 0) ? 'increase' : 'decrease'
            },
            {
              icon: healthStatus.icon,
              label: 'System Health',
              value: `${data.metrics.systemHealth || 0}%`,
              color: healthStatus.color,
              bgColor: healthStatus.bgColor,
              change: calculateMetricChange(data.metrics.systemHealth, data.metrics.previousSystemHealth),
              changeType: (data.metrics.systemHealth || 0) >= (data.metrics.previousSystemHealth || 0) ? 'increase' : 'decrease'
            },
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      metric.changeType === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Alerts */}
        {data.systemAlerts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
            <div className="space-y-3">
              {data.systemAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <p className="font-medium">{alert.message}</p>
                    </div>
                    <span className="text-sm opacity-75">{formatTime(alert.timestamp)}</span>
                  </div>
                  {alert.details && (
                    <p className="text-sm opacity-75 mt-2 ml-8">{alert.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: 'Add User', icon: UserPlus, href: '/admin/users/new', color: 'bg-blue-600 hover:bg-blue-700' },
              { name: 'View Users', icon: Users, href: '/users', color: 'bg-green-600 hover:bg-green-700' },
              { name: 'System Settings', icon: Settings, href: '/admin/settings', color: 'bg-purple-600 hover:bg-purple-700' },
              { name: 'Audit Logs', icon: Eye, href: '/admin/logs', color: 'bg-orange-600 hover:bg-orange-700' },
              { name: 'Reports', icon: BarChart3, href: '/reports', color: 'bg-indigo-600 hover:bg-indigo-700' },
              { name: 'Export Data', icon: Download, href: '/admin/export', color: 'bg-gray-600 hover:bg-gray-700' },
            ].map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors text-center`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type || activity.activity_type)}`}>
                      {getActivityIcon(activity.type || activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp || activity.created_at)}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-400 mt-1">by {activity.user}</p>
                      )}
                    </div>
                    {activity.status && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'success' ? 'bg-green-100 text-green-700' :
                        activity.status === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Module Usage */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Module Usage</h2>
              <Link to="/admin/modules" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage →
              </Link>
            </div>
            <div className="space-y-4">
              {data.moduleUsage.length > 0 ? (
                data.moduleUsage.map((module, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{module.name || module.module_name}</span>
                        {module.status === 'active' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {module.status === 'inactive' && <XCircle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{module.users || module.user_count} users</span>
                        <span className="text-sm font-medium text-gray-900">{module.usage || module.usage_percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          module.status === 'active' ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${module.usage || module.usage_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Zap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No module usage data</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Branch Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Branch Overview</h2>
            <Link to="/admin/branches" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Manage branches →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.branchStats.length > 0 ? (
              data.branchStats.map((branch) => {
                const branchHealth = branch.health || branch.health_score || 0;
                return (
                  <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Building className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{branch.name || branch.branch_name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          {branchHealth >= 95 ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : branchHealth >= 80 ? (
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {branchHealth >= 95 ? 'Healthy' : branchHealth >= 80 ? 'Warning' : 'Critical'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Users:</span>
                        <span className="font-medium">{branch.users || branch.user_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Items:</span>
                        <span className="font-medium">{(branch.items || branch.item_count || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Health:</span>
                        <span className={`font-medium ${
                          branchHealth >= 95 ? 'text-green-600' :
                          branchHealth >= 90 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {branchHealth}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No branch data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;