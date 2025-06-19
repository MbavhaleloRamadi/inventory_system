// src/components/Dashboard/DashboardRouter.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import LogisticsDashboard from './LogisticsDashboard';
import InventoryClerkDashboard from './InventoryClerkDashboard';
import { AlertTriangle } from 'lucide-react';

const DashboardRouter = () => {
  const { user, loading } = useAuth();

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

  if (!user || !user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-600">Unable to determine user role. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  // Route based on user role
  switch (user.role.toLowerCase()) {
    case 'admin':
    case 'administrator':
      return <AdminDashboard user={user} />;
    
    case 'logistics':
    case 'driver':
    case 'collector':
      return <LogisticsDashboard user={user} />;
    
    case 'staff':
    case 'clerk':
    case 'inventory_clerk':
    case 'operator':
      return <InventoryClerkDashboard user={user} />;
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unknown Role</h3>
            <p className="text-gray-600">
              Role "{user.role}" is not recognized. Please contact your administrator.
            </p>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;