// src/pages/Dashboard/InventoryClerkDashboard.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Scan,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  Plus,
  Minus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Box,
  Warehouse,
  FileText,
  Camera,
  QrCode,
  Download,
  Upload,
  Settings,
  Bell,
  ShoppingCart,
  Archive,
} from "lucide-react";
import { dashboardAPI } from "../../services/api";
import toast from "react-hot-toast";

// Import the modals - FIXED PATHS
import ScanItemModal from "../../components/modals/ScanItemModal";
import AddStockModal from "../../components/modals/AddStockModal";
import IssueStockModal from "../../components/modals/IssueStockModal";
import SearchItemsModal from "../../components/modals/SearchItemsModal";

const InventoryClerkDashboard = ({ user }) => {
  const [data, setData] = useState({
    metrics: {
      totalItems: 0,
      lowStockAlerts: 0,
      pendingRequests: 0,
      recentTransactions: 0,
      availableItems: 0,
      reservedItems: 0,
    },
    lowStockItems: [],
    recentActivity: [],
    pendingTasks: [],
    quickStats: [],
    recentRequests: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // State for controlling modals
  const [isScanModalOpen, setScanModalOpen] = useState(false);
  const [isAddStockModalOpen, setAddStockModalOpen] = useState(false);
  const [isIssueStockModalOpen, setIssueStockModalOpen] = useState(false);
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);

  const fetchInventoryData = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Use the dashboard API
      const response = await dashboardAPI.getInventoryDashboardData(); // Correct function

      // Set the data from the API response, with fallbacks
      const responseData = response.data;
      setData({
        metrics: {
          totalItems: responseData.metrics?.totalItems || 0,
          lowStockAlerts: responseData.metrics?.lowStockAlerts || 0,
          pendingRequests: responseData.metrics?.pendingRequests || 0,
          recentTransactions: responseData.metrics?.recentTransactions || 0,
          availableItems: responseData.metrics?.availableItems || 0,
          reservedItems: responseData.metrics?.reservedItems || 0,
        },
        lowStockItems: responseData.lowStockItems || [],
        recentActivity: responseData.recentActivity || [],
        pendingTasks: responseData.pendingTasks || [],
        quickStats: responseData.quickStats || [],
        recentRequests: responseData.recentRequests || [],
      });

      if (!refreshing) {
        toast.success("Dashboard loaded successfully");
      } else {
        toast.success("Dashboard refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventoryData();
  };

  // Modal handlers
  const handleScanItem = () => {
    setScanModalOpen(true);
  };

  const handleAddStock = () => {
    setAddStockModalOpen(true);
  };

  const handleIssueItems = () => {
    setIssueStockModalOpen(true);
  };

  const handleSearchItems = () => {
    setSearchModalOpen(true);
  };

  const handleReports = () => {
    navigate("/reports");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  // Callback functions for when modals complete their actions
  const handleStockAdded = () => {
    // Refresh dashboard data when stock is added
    fetchInventoryData();
  };

  const handleStockIssued = () => {
    // Refresh dashboard data when stock is issued
    fetchInventoryData();
  };

  const handleItemScanned = () => {
    // Refresh dashboard data when item is scanned
    fetchInventoryData();
  };

  // Close modal handlers
  const closeScanModal = () => setScanModalOpen(false);
  const closeAddStockModal = () => setAddStockModalOpen(false);
  const closeIssueStockModal = () => setIssueStockModalOpen(false);
  const closeSearchModal = () => setSearchModalOpen(false);

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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "stock_in":
        return <TrendingUp className="h-4 w-4" />;
      case "stock_out":
        return <TrendingDown className="h-4 w-4" />;
      case "adjustment":
        return <Edit className="h-4 w-4" />;
      case "scan":
        return <Scan className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "stock_in":
        return "bg-green-100 text-green-600";
      case "stock_out":
        return "bg-blue-100 text-blue-600";
      case "adjustment":
        return "bg-yellow-100 text-yellow-600";
      case "scan":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "normal":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading inventory dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Inventory Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Welcome back, {user?.firstName || "User"}!
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Package,
              label: "Total Items",
              value: data.metrics.totalItems.toLocaleString(),
              subValue: `${data.metrics.availableItems} available`,
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              icon: AlertTriangle,
              label: "Low Stock Alerts",
              value: data.metrics.lowStockAlerts,
              subValue: "Requires attention",
              color: "text-red-600",
              bgColor: "bg-red-50",
            },
            {
              icon: ClipboardList,
              label: "Pending Requests",
              value: data.metrics.pendingRequests,
              subValue: "Awaiting approval",
              color: "text-yellow-600",
              bgColor: "bg-yellow-50",
            },
          ].map((metric, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {metric.value}
                  </p>
                  <p className="text-sm text-gray-500">{metric.subValue}</p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                name: "Scan Item",
                icon: QrCode,
                action: handleScanItem,
                color: "bg-blue-600 hover:bg-blue-700",
              },
              {
                name: "Add Stock",
                icon: Plus,
                action: handleAddStock,
                color: "bg-green-600 hover:bg-green-700",
              },
              {
                name: "Issue Items",
                icon: Minus,
                action: handleIssueItems,
                color: "bg-orange-600 hover:bg-orange-700",
              },
              {
                name: "Search Items",
                icon: Search,
                action: handleSearchItems,
                color: "bg-purple-600 hover:bg-purple-700",
              },
              {
                name: "Reports",
                icon: BarChart3,
                action: handleReports,
                color: "bg-indigo-600 hover:bg-indigo-700",
              },
              {
                name: "Settings",
                icon: Settings,
                action: handleSettings,
                color: "bg-gray-600 hover:bg-gray-700",
              },
            ].map((action) => (
              <button
                key={action.name}
                onClick={action.action}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center gap-2 transition-colors text-center hover:transform hover:scale-105`}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{action.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {data.lowStockItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Low Stock Alerts
              </h2>
              <Link
                to="/inventory/low-stock"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {data.lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        SKU: {item.sku}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Current: {item.currentStock}</span>
                        <span>Min: {item.minStock}</span>
                        <span>Location: {item.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/inventory/item/${item.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/inventory/reorder/${item.id}`}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Reorder
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Link
                to="/inventory/activity"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg ${getActivityColor(
                        activity.type
                      )}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.user} • {formatTime(activity.timestamp)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${
                          activity.quantity > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {activity.quantity > 0 ? "+" : ""}
                        {activity.quantity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Tasks
              </h2>
              <Link
                to="/tasks"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-4">
              {data.pendingTasks.length > 0 ? (
                data.pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Due: {formatDate(task.dueDate)} • Est:{" "}
                          {task.estimatedTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Assigned by {task.assignedBy}
                      </p>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                        Start Task
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {data.quickStats.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {data.quickStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScanItemModal
        isOpen={isScanModalOpen}
        onClose={closeScanModal}
        onItemScanned={handleItemScanned}
      />
      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={closeAddStockModal}
        onStockAdded={handleStockAdded}
      />
      <IssueStockModal
        isOpen={isIssueStockModalOpen}
        onClose={closeIssueStockModal}
        onStockIssued={handleStockIssued}
      />
      <SearchItemsModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
      />
    </div>
  );
};

export default InventoryClerkDashboard;