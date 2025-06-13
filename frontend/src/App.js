import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout Components
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';

// Auth Components
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Main Application Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Inventory from './pages/Inventory/Inventory';
import InventoryDetail from './pages/Inventory/InventoryDetail';
import PurchaseOrders from './pages/PurchaseOrders/PurchaseOrders';
import PODetail from './pages/PurchaseOrders/PODetail';
import Requisitions from './pages/Requisitions/Requisitions';
import RequisitionDetail from './pages/Requisitions/RequisitionDetail';
import TemplateBuilder from './pages/Templates/TemplateBuilder';
import Locations from './pages/Locations/Locations';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import Settings from './pages/Settings/Settings';

// Hooks and Context
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Styles
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="App">
            <Toaster position="top-right" />
            
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              } />
              <Route path="/register" element={
                <AuthLayout>
                  <Register />
                </AuthLayout>
              } />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Inventory Routes */}
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/inventory/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Purchase Orders Routes */}
              <Route path="/purchase-orders" element={
                <ProtectedRoute>
                  <Layout>
                    <PurchaseOrders />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/purchase-orders/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <PODetail />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Requisitions Routes */}
              <Route path="/requisitions" element={
                <ProtectedRoute>
                  <Layout>
                    <Requisitions />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/requisitions/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <RequisitionDetail />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Template Builder */}
              <Route path="/templates" element={
                <ProtectedRoute>
                  <Layout>
                    <TemplateBuilder />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Locations */}
              <Route path="/locations" element={
                <ProtectedRoute>
                  <Layout>
                    <Locations />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Reports */}
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Users Management */}
              <Route path="/users" element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Settings */}
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;