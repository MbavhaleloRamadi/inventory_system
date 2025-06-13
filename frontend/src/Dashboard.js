import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  ShoppingCart,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Activity,
  RefreshCw
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState({
    stockSummary: {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0
    },
    recentMovements: [],
    pendingRequisitions: [],
    locationSummary: [],
    activityFeed: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick action buttons
  const quickActions = [
    { name: 'Add Item', icon: Plus, href: '/inventory/new', color: 'bg-green-500 hover:bg-green-600' },
    { name: 'New PO', icon: ShoppingCart, href: '/purchase-orders/new', color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Requisition', icon: FileText, href: '/requisitions/new', color: 'bg-purple-500 hover:bg-purple-600' },
    { name: 'Stock Take', icon: Package, href: '/inventory?action=stocktake', color: 'bg-orange-500 hover:bg-orange-600' },
  ];

  const fetchDashboardData = async () => {
    try {
      const [
        stockSummaryResponse,
        recentMovementsResponse,
        pendingRequisitionsResponse,
        locationSummaryResponse,
        activityFeedResponse
      ] = await Promise.all([
        dashboardAPI.getStockSummary(),
        dashboardAPI.getRecentMovements(5),
        dashboardAPI.getPendingRequisitions(),
        dashboardAPI.getLocationSummary(),
        dashboardAPI.getActivityFeed(5)
      ]);

      setData({
        stockSummary: stockSummaryResponse.data,
        recentMovements: recentMovementsResponse.data,
        pendingRequisitions: pendingRequisitionsResponse.data,
        locationSummary: locationSummaryResponse.data,
        activityFeed: activityFeedResponse.data
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatMovementTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to RedCore360 Inventory Management</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{data.stockSummary.totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{data.stockSummary.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Out of Stock</p>
              <p className="text-2xl font-bold text-gray-900">{data.stockSummary.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${data.stockSummary.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center space-y-2 transition-colors hover:shadow-lg transform hover:-translate-y-1`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Movements */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Movements</h2>
            <Link to="/inventory" className="text-sm text-red-600 hover:text-red-800">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {data.recentMovements.length > 0 ? (
              data.recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center space-x-4">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                    movement.type === 'in' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {movement.item_name || movement.item}
                    </p>
                    <p className="text-sm text-gray-500">
                      {movement.type === 'in' ? '+' : '-'}{movement.quantity} • {movement.location_name || movement.location}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatMovementTime(movement.created_at || movement.timestamp)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent movements</p>
            )}
          </div>
        </div>

        {/* Pending Requisitions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Requisitions</h2>
            <Link to="/requisitions" className="text-sm text-red-600 hover:text-red-800">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {data.pendingRequisitions.length > 0 ? (
              data.pendingRequisitions.map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{req.title || req.item}</p>
                    <p className="text-sm text-gray-500">by {req.requested_by_name || req.requestor}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      req.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(req.created_at || req.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No pending requisitions</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory by Location */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventory by Location</h2>
          <Link to="/locations" className="text-sm text-red-600 hover:text-red-800">
            Manage locations
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.locationSummary.map((location, index) => (
            <div key={location.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900">{location.name}</h3>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium text-gray-900">{location.item_count || location.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Value:</span>
                  <span className="font-medium text-gray-900">${(location.total_value || location.value).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link to="/reports" className="text-sm text-red-600 hover:text-red-800">
            View reports
          </Link>
        </div>
        <div className="space-y-3">
          {data.activityFeed.length > 0 ? (
            data.activityFeed.map((activity, index) => (
              <div key={activity.id || index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    activity.type === 'stock' ? 'bg-green-100' :
                    activity.type === 'purchase_order' ? 'bg-blue-100' :
                    activity.type === 'alert' ? 'bg-yellow-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'stock' && <Package className="h-4 w-4 text-green-600" />}
                    {activity.type === 'purchase_order' && <ShoppingCart className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {activity.type === 'requisition' && <FileText className="h-4 w-4 text-purple-600" />}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatMovementTime(activity.created_at || activity.timestamp)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;