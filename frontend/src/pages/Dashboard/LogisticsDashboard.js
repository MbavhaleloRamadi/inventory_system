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
  Map,
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
    recentHistory: [],
    performanceRating: 4.5,
    activeTime: 0,
    isPaused: false
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('today');
  const [showAlerts, setShowAlerts] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const fetchLogisticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch the data from your central dashboard endpoint
      const response = await dashboardAPI.getDashboardData();
      const data = response.data;

      // Use the live data from the API to set your component's state
      setData({
        todayAssignments: data.today_assignments || [],
        currentTrip: data.current_trip || null,
        completedToday: data.completed_today || 0,
        totalDistance: data.total_distance || 0,
        onlineStatus: data.online_status !== undefined ? data.online_status : true,
        recentHistory: data.recent_history || [],
        performanceRating: data.performance_rating || 4.5,
        activeTime: data.active_time || 0,
        isPaused: data.is_paused || false
      });

      toast.success('Dashboard refreshed');
    } catch (error) {
      console.error('Error fetching logistics data:', error);
      toast.error('Failed to refresh data');
      // Set empty data on error
      setData({
        todayAssignments: [],
        currentTrip: null,
        completedToday: 0,
        totalDistance: 0,
        onlineStatus: true,
        recentHistory: [],
        performanceRating: 4.5,
        activeTime: 0,
        isPaused: false
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogisticsData();
    
    // Timer for active time tracking
    const timer = setInterval(() => {
      if (!data.isPaused && data.onlineStatus) {
        setData(prevData => ({
          ...prevData,
          activeTime: prevData.activeTime + 1
        }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [data.isPaused, data.onlineStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogisticsData();
  };

  const handlePauseToggle = () => {
    setData(prevData => ({
      ...prevData,
      isPaused: !prevData.isPaused
    }));
    toast.success(data.isPaused ? 'Work resumed' : 'Work paused');
  };

  const handleStartTrip = (taskId) => {
    toast.success('Trip started - GPS tracking enabled');
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

  const formatActiveTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getAlerts = () => {
    const alerts = [];
    
    // Check for high priority pending tasks
    const highPriorityPending = data.todayAssignments.filter(
      task => task.priority === 'high' && task.status === 'pending'
    );
    if (highPriorityPending.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${highPriorityPending.length} high priority task(s) pending`,
        icon: AlertTriangle
      });
    }

    // Check for offline status
    if (!data.onlineStatus) {
      alerts.push({
        type: 'error',
        message: 'You are currently offline',
        icon: AlertCircle
      });
    }

    // Check for paused status
    if (data.isPaused) {
      alerts.push({
        type: 'info',
        message: 'Work timer is paused',
        icon: Pause
      });
    }

    return alerts;
  };

  const alerts = getAlerts();

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
              <div className="relative">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white"
                  />
                ) : (
                  <UserCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Logistics Dashboard</h1>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">Welcome back, {user?.firstName || 'User'}!</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-gray-600">{data.performanceRating}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                data.onlineStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {data.onlineStatus ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {data.onlineStatus ? 'Online' : 'Offline'}
              </div>
              {alerts.length > 0 && (
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 text-orange-500 hover:text-orange-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {alerts.length}
                  </span>
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Alerts Panel */}
          {showAlerts && alerts.length > 0 && (
            <div className="mb-4 space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className={`flex items-center gap-2 p-3 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  <alert.icon className="h-4 w-4" />
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Today's Stats */}
          <div className="grid grid-cols-4 gap-4">
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
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-600">
                <Timer className="h-5 w-5" />
                {formatActiveTime(data.activeTime)}
              </div>
              <div className="text-xs text-gray-500">Active Time</div>
            </div>
          </div>

          {/* Work Timer Controls */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handlePauseToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                data.isPaused 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
            >
              {data.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {data.isPaused ? 'Resume Work' : 'Pause Work'}
            </button>
          </div>
        </div>

        {/* Current Trip Status */}
        {data.currentTrip && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Current Trip</h3>
                <p className="text-sm text-blue-700">To {data.currentTrip.supplier}</p>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(data.currentTrip.supplier?.address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
              >
                <Map className="h-3 w-3" />
                Map
                <ExternalLink className="h-3 w-3" />
              </a>
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
              { id: 'history', label: 'History', icon: History },
              { id: 'profile', label: 'Profile', icon: User }
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Today's Assignments</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className={viewMode === 'grid' ? 'space-y-4' : 'space-y-2'}>
                {data.todayAssignments.length > 0 ? (
                  data.todayAssignments.map((task) => (
                    <div
                      key={task.id}
                      className={`border border-gray-200 rounded-lg hover:border-gray-300 transition-colors ${
                        viewMode === 'grid' ? 'p-4' : 'p-3'
                      }`}
                    >
                      <div className={`flex items-start justify-between ${viewMode === 'grid' ? 'mb-3' : 'mb-2'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-gray-900 ${viewMode === 'list' ? 'text-sm' : ''}`}>
                              {task.supplier?.name || 'Unknown Supplier'}
                            </h3>
                            {task.priority && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <p className={`text-gray-600 mb-1 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                            {task.poNumber}
                          </p>
                          <div className={`flex items-center gap-1 text-gray-500 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                            <Clock className="h-3 w-3" />
                            {task.scheduledTime} - {task.estimatedTime}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status?.replace('_', ' ') || 'pending'}
                          </span>
                          <button
                            onClick={() => handleTaskAction(task.id, 'view')}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {viewMode === 'grid' && (
                        <>
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
                        </>
                      )}
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
                    <div key={day.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{formatDate(day.date)}</h3>
                          <p className="text-sm text-gray-500">{day.tasks} tasks completed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{day.distance}km</p>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              day.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {day.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-4">
              <div className="text-center mb-6">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full mx-auto mb-4 border-4 border-blue-100"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">{data.performanceRating} Rating</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">This Week's Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{data.completedToday * 5}</div>
                      <div className="text-xs text-gray-500">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{(data.totalDistance * 7).toFixed(0)}km</div>
                      <div className="text-xs text-gray-500">Distance Covered</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Work Hours</h3>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Active today: {formatActiveTime(data.activeTime)}
                    </span>
                  </div>
                </div>
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

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{selectedTask.supplier?.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">PO: {selectedTask.poNumber}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status?.replace('_', ' ') || 'pending'}
                    </span>
                    {selectedTask.priority && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    )}
                  </div>
                </div>
                
                {selectedTask.supplier?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{selectedTask.supplier.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Schedule</p>
                    <p className="text-sm text-gray-600">{selectedTask.scheduledTime} - {selectedTask.estimatedTime}</p>
                  </div>
                </div>

                {selectedTask.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm font-medium text-yellow-800 mb-1">Notes</p>
                    <p className="text-sm text-yellow-700">{selectedTask.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedTask.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleTaskAction(selectedTask.id, 'start');
                        setSelectedTask(null);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Play className="h-3 w-3" />
                      Start Trip
                    </button>
                  )}
                  
                  {selectedTask.status === 'in_transit' && (
                    <button
                      onClick={() => {
                        handleTaskAction(selectedTask.id, 'complete');
                        setSelectedTask(null);
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </button>
                  )}

                  {selectedTask.supplier?.contact && (
                    <a
                      href={`tel:${selectedTask.supplier.contact}`}
                      className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      Call
                    </a>
                  )}

                  {selectedTask.supplier?.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(selectedTask.supplier.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogisticsDashboard;