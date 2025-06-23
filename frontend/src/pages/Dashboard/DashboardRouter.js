// src/components/Dashboard/DashboardRouter.js
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import LogisticsDashboard from './LogisticsDashboard';
import InventoryClerkDashboard from './InventoryClerkDashboard';
import ManagerDashboard from './ManagerDashboard';
import ProcurementDashboard from './ProcurementDashboard';
import FinanceDashboard from './FinanceDashboard';
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

  // Route based on user role - ALIGNED WITH BACKEND ROLE_CHOICES
  // Backend roles: developer, admin, manager, staff, procurement, finance, logistics
  switch (user.role.toLowerCase()) {
    case 'developer':
    case 'admin':
      return <AdminDashboard user={user} />;
    
    case 'manager':
      return <ManagerDashboard user={user} />;
    
    case 'procurement':
      return <ProcurementDashboard user={user} />;
    
    case 'finance':
      return <FinanceDashboard user={user} />;
    
    case 'logistics':
      return <LogisticsDashboard user={user} />;
    
    case 'staff':
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
            <div className="mt-4 text-sm text-gray-500">
              <p>Valid roles: developer, admin, manager, staff, procurement, finance, logistics</p>
            </div>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;