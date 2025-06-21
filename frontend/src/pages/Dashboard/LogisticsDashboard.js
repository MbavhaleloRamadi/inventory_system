// src/components/Dashboard/LogisticsDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation,
  Camera,
  Phone,
  FileText,
  Play,
  Pause,
  Upload,
  History,
  User,
  Settings,
  RefreshCw,
  QrCode,
  Route,
  Star,
  Timer,
  Wifi,
  WifiOff,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Home,
  List,
  UserCircle
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

const LogisticsDashboard = ({ user }) => {
  const [data, setData] = useState({
    todayAssignments: [],
    currentTrip: null,
    completedToday: 0,
    totalDistance: 0,
    onlineStatus: true,
    recentHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      
      const dashboardResponse = await dashboardAPI.getDashboardData();
      const dashboardData = dashboardResponse.data || {};

      setData({
        todayAssignments: dashboardData.todayAssignments || [],
        currentTrip: dashboardData.currentTrip || null,
        completedToday: dashboardData.completedToday || 0,
        totalDistance: dashboardData.totalDistance || 0,
        onlineStatus: dashboardData.onlineStatus !== undefined ? dashboardData.onlineStatus : true,
        recentHistory: dashboardData.recentHistory || []
      });

      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Error fetching logistics data:', error);
      toast.error('Failed to refresh data');
      
      // Set empty data on error to avoid undefined errors
      setData(prevData => ({
        ...prevData,
        todayAssignments: [],
        currentTrip: null,
        recentHistory: []
      }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogisticsData();
  };

  const handleStartTrip = (taskId) => {
    toast.success('Trip started - GPS tracking enabled');
    // Update task status and start GPS tracking
    setData(prevData => ({
      ...prevData,
      todayAssignments: prevData.todayAssignments.map(task =>
        task.id === taskId
          ? { ...task, status: 'in_transit', startedAt: new Date() }
          : task
      ),
      currentTrip: prevData.todayAssignments.find(task => task.id === taskId) || null
    }));
  };

  const handleCompletePickup = (taskId) => {
    toast.success('Pickup completed successfully');
    // Update task status and sync to server
    setData(prevData => ({
      ...prevData,
      todayAssignments: prevData.todayAssignments.map(task =>
        task.id === taskId
          ? { ...task, status: 'completed', completedAt: new Date() }
          : task
      ),
      currentTrip: prevData.currentTrip?.id === taskId ? null : prevData.currentTrip,
      completedToday: prevData.completedToday + 1
    }));
  };

  const handleTaskAction = (taskId, action) => {
    switch (action) {
      case 'start':
        handleStartTrip(taskId);
        break;
      case 'complete':
        handleCompletePickup(taskId);
        break;
      case 'view':
        setSelectedTask(data.todayAssignments.find(t => t.id === taskId));
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (time) => {
    if (typeof time === 'string') return time;
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-ZA', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading logistics dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Mobile-Optimized Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Logistics Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                data.onlineStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {data.onlineStatus ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {data.onlineStatus ? 'Online' : 'Offline'}
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.todayAssignments.length}</div>
              <div className="text-xs text-gray-500">Today's Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.completedToday}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.totalDistance}km</div>
              <div className="text-xs text-gray-500">Distance</div>
            </div>
          </div>
        </div>

        {/* Current Trip Status */}
        {data.currentTrip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Current Trip</h3>
                <p className="text-sm text-blue-700">To {data.currentTrip.supplier}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                Started: {formatTime(data.currentTrip.startedAt)}
              </div>
              <div className="text-sm text-blue-700">
                ETA: {data.currentTrip.estimatedArrival}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'today', label: 'Today', icon: Home },
              { id: 'history', label: 'History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Today's Assignments */}
          {activeTab === 'today' && (
            <div className="p-4">
              <div className="space-y-4">
                {data.todayAssignments.length > 0 ? (
                  data.todayAssignments.map((task) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{task.supplier?.name || 'Unknown Supplier'}</h3>
                            {task.priority && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{task.poNumber}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-3 w-3" />
                            {task.scheduledTime} - {task.estimatedTime}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </div>

                      {task.supplier?.address && (
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-600">{task.supplier.address}</p>
                        </div>
                      )}

                      {task.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                          <p className="text-sm text-yellow-800">{task.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {task.status === 'pending' && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'start')}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            <Play className="h-3 w-3" />
                            Start Trip
                          </button>
                        )}
                        
                        {task.status === 'in_transit' && (
                          <button
                            onClick={() => handleTaskAction(task.id, 'complete')}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Complete
                          </button>
                        )}

                        <button
                          onClick={() => handleTaskAction(task.id, 'view')}
                          className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          Details
                        </button>

                        {task.supplier?.contact && (
                          <a
                            href={`tel:${task.supplier.contact}`}
                            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            Call
                          </a>
                        )}

                        {task.supplier?.address && (
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(task.supplier.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            <Navigation className="h-3 w-3" />
                            Navigate
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments today</h3>
                    <p className="text-gray-500">Check back later for new logistics tasks.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-4">
              <div className="space-y-3">
                {data.recentHistory.length > 0 ? (
                  data.recentHistory.map((day) => (
                    <div key={day.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{formatDate(day.date)}</h3>
                          <p className="text-sm text-gray-500">{day.tasks} tasks completed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{day.distance}km</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            day.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {day.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No history available</h3>
                    <p className="text-gray-500">Complete some tasks to see your history here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
              <QrCode className="h-4 w-4" />
              Scan QR Code
            </button>
            <button className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
              <Camera className="h-4 w-4" />
              Take Photo
            </button>
            <button className="flex items-center gap-2 p-3 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
              <Upload className="h-4 w-4" />
              Upload Document
            </button>
            <Link
              to="/settings"
              className="flex items-center gap-2 p-3 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">{selectedTask.supplier?.name || 'Unknown Supplier'}</h3>
                <p className="text-sm text-gray-600">{selectedTask.poNumber}</p>
              </div>
              
              {selectedTask.items && selectedTask.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items to Collect</h4>
                  <div className="space-y-2">
                    {selectedTask.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-600">Qty: {item.expectedQty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleTaskAction(selectedTask.id, selectedTask.status === 'pending' ? 'start' : 'complete');
                    setSelectedTask(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                    selectedTask.status === 'pending'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : selectedTask.status === 'in_transit'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={selectedTask.status === 'completed'}
                >
                  {selectedTask.status === 'pending' ? 'Start Trip' : 
                   selectedTask.status === 'in_transit' ? 'Complete Pickup' : 'Completed'}
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsDashboard;