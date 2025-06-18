import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  Plus,
  FileText,
  ShoppingCart,
  MapPin,
  DollarSign,
  RefreshCw,
  Settings,
  Grid,
  Move,
  Eye,
  EyeOff,
  Save,
  MoreHorizontal,
  Calendar,
  Users,
  Activity
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState({
    stockSummary: {
      totalItems: 1247,
      lowStock: 23,
      outOfStock: 5,
      totalValue: 125780
    },
    recentMovements: [
      { id: 1, item_name: 'Laptop Dell XPS 13', type: 'in', quantity: 5, location_name: 'Warehouse A', created_at: new Date(Date.now() - 1000 * 60 * 30) },
      { id: 2, item_name: 'Office Chair', type: 'out', quantity: 2, location_name: 'Office Floor 2', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      { id: 3, item_name: 'Wireless Mouse', type: 'in', quantity: 15, location_name: 'Storage B', created_at: new Date(Date.now() - 1000 * 60 * 60 * 4) },
      { id: 4, item_name: 'Monitor 24"', type: 'out', quantity: 3, location_name: 'IT Department', created_at: new Date(Date.now() - 1000 * 60 * 60 * 6) },
      { id: 5, item_name: 'Desk Lamp', type: 'in', quantity: 8, location_name: 'Storage A', created_at: new Date(Date.now() - 1000 * 60 * 60 * 8) },
    ],
    pendingRequisitions: [
      { id: 1, title: 'Office Supplies Request', requested_by_name: 'John Smith', status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      { id: 2, title: 'IT Equipment', requested_by_name: 'Sarah Johnson', status: 'approved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48) },
      { id: 3, title: 'Furniture Request', requested_by_name: 'Mike Wilson', status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72) },
      { id: 4, title: 'Marketing Materials', requested_by_name: 'Lisa Chen', status: 'approved', created_at: new Date(Date.now() - 1000 * 60 * 60 * 96) },
    ],
    locationSummary: [
      { id: 1, name: 'Warehouse A', item_count: 450, total_value: 45000 },
      { id: 2, name: 'Office Floor 1', item_count: 120, total_value: 25000 },
      { id: 3, name: 'Storage B', item_count: 300, total_value: 30000 },
      { id: 4, name: 'IT Room', item_count: 200, total_value: 25780 },
    ],
    activityFeed: [
      { id: 1, type: 'stock', description: 'Stock updated for Laptop Dell XPS 13', created_at: new Date(Date.now() - 1000 * 60 * 15) },
      { id: 2, type: 'purchase_order', description: 'New purchase order #PO-2024-001 created', created_at: new Date(Date.now() - 1000 * 60 * 45) },
      { id: 3, type: 'alert', description: 'Low stock alert: Wireless keyboards', created_at: new Date(Date.now() - 1000 * 60 * 60) },
      { id: 4, type: 'requisition', description: 'Requisition approved for Office Supplies', created_at: new Date(Date.now() - 1000 * 60 * 90) },
      { id: 5, type: 'stock', description: 'Inventory adjustment completed for Storage B', created_at: new Date(Date.now() - 1000 * 60 * 120) },
    ]
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customizationMode, setCustomizationMode] = useState(false);
  const [widgets, setWidgets] = useState([
    { id: 'stock-summary', name: 'Stock Overview', visible: true, position: 0, size: 'full' },
    { id: 'quick-actions', name: 'Quick Actions', visible: true, position: 1, size: 'full' },
    { id: 'recent-movements', name: 'Recent Movements', visible: true, position: 2, size: 'half' },
    { id: 'pending-requisitions', name: 'Pending Requisitions', visible: true, position: 3, size: 'half' },
    { id: 'location-summary', name: 'Location Overview', visible: true, position: 4, size: 'full' },
    { id: 'activity-feed', name: 'Recent Activity', visible: true, position: 5, size: 'full' },
  ]);

  const [draggedWidget, setDraggedWidget] = useState(null);

  const quickActions = [
    { name: 'Add Item', icon: Plus, href: '/inventory/new', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'New PO', icon: ShoppingCart, href: '/purchase-orders/new', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Requisition', icon: FileText, href: '/requisitions/new', color: 'bg-purple-600 hover:bg-purple-700' },
    { name: 'Stock Take', icon: Package, href: '/inventory?action=stocktake', color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboardData();
      setData(response.data);
      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to refresh data');
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

  const toggleCustomization = () => {
    setCustomizationMode(!customizationMode);
    if (customizationMode) {
      toast.success('Layout saved');
    }
  };

  const toggleWidgetVisibility = (widgetId) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const handleDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetWidget) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget.id === targetWidget.id) return;

    setWidgets(prev => {
      const newWidgets = [...prev];
      const draggedIndex = newWidgets.findIndex(w => w.id === draggedWidget.id);
      const targetIndex = newWidgets.findIndex(w => w.id === targetWidget.id);

      [newWidgets[draggedIndex], newWidgets[targetIndex]] = [newWidgets[targetIndex], newWidgets[draggedIndex]];

      return newWidgets.map((widget, index) => ({
        ...widget,
        position: index
      }));
    });

    setDraggedWidget(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getWidgetComponent = (widget) => {
    if (!data || !data.stockSummary) return null;

    switch (widget.id) {
      case 'stock-summary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Package,
                label: 'Total Items',
                value: data.stockSummary.totalItems.toLocaleString(),
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                trend: '+2.3%',
                trendUp: true
              },
              {
                icon: AlertTriangle,
                label: 'Low Stock Items',
                value: data.stockSummary.lowStock,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                trend: '-12%',
                trendUp: false
              },
              {
                icon: TrendingDown,
                label: 'Out of Stock',
                value: data.stockSummary.outOfStock,
                color: 'text-red-600',
                bgColor: 'bg-red-50',
                trend: '+5%',
                trendUp: false
              },
              {
                icon: DollarSign,
                label: 'Total Value',
                value: `$${data.stockSummary.totalValue.toLocaleString()}`,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                trend: '+8.1%',
                trendUp: true
              },
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-600">{item.label}</p>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${item.trendUp ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
                        }`}>
                        {item.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'quick-actions':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className={`${action.color} text-white rounded-lg p-6 flex flex-col items-center gap-3 transition-colors`}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{action.name}</span>
              </Link>
            ))}
          </div>
        );

      case 'recent-movements':
        return (
          <div className="space-y-4">
            {(data.recentMovements || []).slice(0, 5).map((movement) => (
              <div key={movement.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${movement.type === 'in' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{movement.item_name}</p>
                  <p className="text-sm text-gray-500">
                    {movement.type === 'in' ? '+' : '-'}{movement.quantity} • {movement.location_name}
                  </p>
                </div>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTime(movement.created_at)}
                </span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link to="/movements" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all movements →
              </Link>
            </div>
          </div>
        );

      case 'pending-requisitions':
        return (
          <div className="space-y-4">
            {(data.pendingRequisitions || []).slice(0, 4).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{req.title}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>by {req.requested_by_name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link to="/requisitions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all requisitions →
              </Link>
            </div>
          </div>
        );

      case 'location-summary':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(data.locationSummary || []).map((loc) => (
              <div key={loc.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">{loc.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items:</span>
                    <span className="font-medium text-gray-900">{loc.item_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Value:</span>
                    <span className="font-medium text-gray-900">${loc.total_value.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'activity-feed':
        return (
          <div className="space-y-4">
            {(data.activityFeed || []).slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${activity.type === 'stock' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'purchase_order' ? 'bg-green-100 text-green-600' :
                      activity.type === 'alert' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-purple-100 text-purple-600'
                    }`}>
                    {activity.type === 'stock' && <Package className="h-4 w-4" />}
                    {activity.type === 'purchase_order' && <ShoppingCart className="h-4 w-4" />}
                    {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                    {activity.type === 'requisition' && <FileText className="h-4 w-4" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(activity.created_at)}</p>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link to="/activity" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all activity →
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const sortedWidgets = widgets.sort((a, b) => a.position - b.position);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              </div>
              <p className="text-gray-600 mt-1">Overview of your inventory management system</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleCustomization}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${customizationMode
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {customizationMode ? <Save className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                {customizationMode ? 'Save Layout' : 'Customize'}
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

        {/* Customization Panel */}
        {customizationMode && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customize Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Grid className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{widget.name}</span>
                  </div>
                  <button
                    onClick={() => toggleWidgetVisibility(widget.id)}
                    className={`p-2 rounded-lg transition-colors ${widget.visible
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                  >
                    {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widgets */}
        <div className="space-y-6">
          {sortedWidgets
            .filter(widget => widget.visible)
            .map((widget) => (
              <div
                key={widget.id}
                draggable={customizationMode}
                onDragStart={(e) => handleDragStart(e, widget)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget)}
                className={`bg-white rounded-lg border border-gray-200 p-6 ${customizationMode ? 'cursor-move' : ''}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">{widget.name}</h2>
                  <div className="flex items-center gap-2">
                    {customizationMode && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Move className="h-4 w-4" />
                        <span className="text-sm">Drag to reorder</span>
                      </div>
                    )}
                    {!customizationMode && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                {getWidgetComponent(widget)}
              </div>
            ))}
        </div>

        {/* Empty State */}
        {sortedWidgets.filter(widget => widget.visible).length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No widgets visible</h3>
            <p className="text-gray-600 mb-6">
              All dashboard widgets are currently hidden. Enable some widgets to see your data.
            </p>
            <button
              onClick={toggleCustomization}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Customize Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;