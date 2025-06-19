// src/components/Dashboard/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building,
  Package,
  AlertTriangle,
  Activity,
  Shield,
  Settings,
  Database,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  MoreHorizontal,
  Download,
  Upload,
  Bell,
  Eye,
  UserPlus,
  BarChart3,
  Globe,
  Zap,
  Lock
} from 'lucide-react';
import { authAPI, dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = ({ user }) => {
  const [data, setData] = useState({
    metrics: {
      totalUsers: 0,
      totalOrganizations: 0,
      enabledModules: 0,
      inventoryActivity: 0,
      lowStockAlerts: 0,
      pendingRequests: 0,
      systemHealth: 95
    },
    recentActivity: [],
    systemAlerts: [],
    userStats: [],
    moduleUsage: [],
    branchStats: [],
    systemStatus: [],
    performanceMetrics: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      // Fetch admin-specific data
      const [dashboardResponse, usersResponse, permissionsResponse] = await Promise.all([
        dashboardAPI.getDashboardData(),
        authAPI.getUsersList({ limit: 10 }),
        authAPI.getPermissions()
      ]);

      // Enhanced mock data with all the new features
      setData({
        metrics: {
          totalUsers: usersResponse.data?.count || 0,
          totalOrganizations: 5,
          enabledModules: 12,
          inventoryActivity: 1247,
          lowStockAlerts: 23,
          pendingRequests: 8,
          systemHealth: 98
        },
        recentActivity: [
          { id: 1, type: 'user', description: 'New user John Smith registered', timestamp: new Date(Date.now() - 1000 * 60 * 15) },
          { id: 2, type: 'system', description: 'Inventory sync completed for Branch A', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
          { id: 3, type: 'security', description: 'Failed login attempts detected', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
          { id: 4, type: 'module', description: 'Barcode scanning module activated', timestamp: new Date(Date.now() - 1000 * 60 * 90) },
          { id: 5, type: 'package', description: 'Inventory package updated', timestamp: new Date(Date.now() - 1000 * 60 * 120) },
          { id: 6, type: 'global', description: 'Global settings synchronized', timestamp: new Date(Date.now() - 1000 * 60 * 180) },
        ],
        systemAlerts: [
          { id: 1, type: 'warning', message: 'Database backup is overdue', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
          { id: 2, type: 'info', message: '3 users pending approval', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4) },
          { id: 3, type: 'error', message: 'Security certificate expires in 7 days', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6) },
        ],
        userStats: usersResponse.data?.results || [],
        moduleUsage: [
          { name: 'Inventory Management', usage: 95, users: 42, trend: 'up' },
          { name: 'Purchase Orders', usage: 78, users: 28, trend: 'up' },
          { name: 'Requisitions', usage: 65, users: 35, trend: 'down' },
          { name: 'Barcode Scanning', usage: 52, users: 18, trend: 'up' },
        ],
        branchStats: [
          { id: 1, name: 'Main Warehouse', users: 15, items: 1247, health: 98, status: 'online', lastSync: new Date(Date.now() - 1000 * 60 * 5) },
          { id: 2, name: 'Branch A', users: 8, items: 623, health: 95, status: 'online', lastSync: new Date(Date.now() - 1000 * 60 * 10) },
          { id: 3, name: 'Branch B', users: 12, items: 891, health: 92, status: 'syncing', lastSync: new Date(Date.now() - 1000 * 60 * 15) },
          { id: 4, name: 'Remote Office', users: 5, items: 234, health: 87, status: 'offline', lastSync: new Date(Date.now() - 1000 * 60 * 60) },
        ],
        systemStatus: [
          { service: 'Database', status: 'healthy', uptime: '99.9%', lastCheck: new Date() },
          { service: 'API Gateway', status: 'healthy', uptime: '99.8%', lastCheck: new Date(Date.now() - 1000 * 60 * 2) },
          { service: 'File Storage', status: 'warning', uptime: '98.5%', lastCheck: new Date(Date.now() - 1000 * 60 * 5) },
          { service: 'Authentication', status: 'healthy', uptime: '100%', lastCheck: new Date(Date.now() - 1000 * 60 * 1) },
        ],
        performanceMetrics: [
          { metric: 'Response Time', value: '245ms', trend: 'down', change: '-15%' },
          { metric: 'CPU Usage', value: '42%', trend: 'up', change: '+5%' },
          { metric: 'Memory Usage', value: '68%', trend: 'stable', change: '0%' },
          { metric: 'Disk Usage', value: '34%', trend: 'up', change: '+2%' },
        ]
      });

      toast.success('Admin dashboard refreshed');
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to refresh admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUpload = () => {
    setShowUploadModal(true);
  };

  const handleExport = () => {
    toast.success('Export started - you will be notified when complete');
  };

  const formatTime = (timestamp) => {
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
      case 'package': return <Package className="h-4 w-4" />;
      case 'global': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-600';
      case 'system': return 'bg-green-100 text-green-600';
      case 'security': return 'bg-red-100 text-red-600';
      case 'module': return 'bg-purple-100 text-purple-600';
      case 'package': return 'bg-orange-100 text-orange-600';
      case 'global': return 'bg-indigo-100 text-indigo-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'syncing':
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default: return <div className="h-3 w-3 rounded-full bg-gray-400" />;
    }
  };

  const filteredActivity = data.recentActivity.filter(activity =>
    activity.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header with Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
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
              value: data.metrics.totalUsers,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50',
              change: '+12%',
              changeType: 'increase'
            },
            {
              icon: Building,
              label: 'Organizations',
              value: data.metrics.totalOrganizations,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              change: '+2',
              changeType: 'increase'
            },
            {
              icon: Zap,
              label: 'Active Modules',
              value: data.metrics.enabledModules,
              color: 'text-purple-600',
              bgColor: 'bg-purple-50',
              change: '+3',
              changeType: 'increase'
            },
            {
              icon: AlertTriangle,
              label: 'System Health',
              value: `${data.metrics.systemHealth}%`,
              color: 'text-green-600',
              bgColor: 'bg-green-50',
              change: '+2%',
              changeType: 'increase'
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

        {/* Performance Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.performanceMetrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{metric.metric}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">{metric.value}</span>
                  <span className={`text-xs font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last updated: {formatTime(new Date())}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.systemStatus.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{service.service}</span>
                  {getStatusIcon(service.status)}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Uptime:</span>
                    <span className="font-medium">{service.uptime}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Last check:</span>
                    <span>{formatTime(service.lastCheck)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                      <Bell className="h-5 w-5" />
                      <p className="font-medium">{alert.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm opacity-75">{formatTime(alert.timestamp)}</span>
                      <button className="p-1 hover:bg-black hover:bg-opacity-10 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
              { name: 'Security', icon: Lock, href: '/admin/security', color: 'bg-red-600 hover:bg-red-700' },
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
              <button
                onClick={handleUpload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Import Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity with Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link to="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {filteredActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
              {filteredActivity.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  <p>No activities found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Module Usage with Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Module Usage</h2>
              <Link to="/admin/modules" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage →
              </Link>
            </div>
            <div className="space-y-4">
              {data.moduleUsage.map((module, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{module.name}</span>
                      {getTrendIcon(module.trend)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{module.users} users</span>
                      <span className="text-sm font-medium text-gray-900">{module.usage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.usage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Overview with Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Branch Overview</h2>
            <Link to="/admin/branches" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Manage branches →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.branchStats.map((branch) => (
              <div key={branch.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Building className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{branch.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      {getStatusIcon(branch.status)}
                      <span className="text-xs text-gray-500 capitalize">{branch.status}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium">{branch.users}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items:</span>
                    <span className="font-medium">{branch.items.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Health:</span>
                    <span className={`font-medium ${
                      branch.health >= 95 ? 'text-green-600' : 
                      branch.health >= 90 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {branch.health}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="text-gray-500">Last sync:</span>
                    <span className="text-gray-600">{formatTime(branch.lastSync)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Data</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                      accept=".csv,.xlsx,.json"
                    />
                    <label
                      htmlFor="file-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer"
                    >
                      Select File
                    </label>
                  </div>
                  {uploadFile && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{uploadFile.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(uploadFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  Supported formats: CSV, Excel (.xlsx), JSON
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Uploading...
                      </div>
                    ) : (
                      'Upload'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;