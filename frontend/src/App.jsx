import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import Sidebar from './components/Sidebar';

// 1. Protected Route: verifies user session exists
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-500 flex items-center justify-center text-sm font-semibold">
        Loading security session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 2. Permission Route: checks if user has permission before rendering page
function PermissionRoute({ permission, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// 3. Authenticated Layout wrapper
function Layout() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="users" element={
            <PermissionRoute permission="users:read">
              <Users />
            </PermissionRoute>
          } />
          
          <Route path="roles" element={
            <PermissionRoute permission="roles:read">
              <Roles />
            </PermissionRoute>
          } />
          
          <Route path="audit-logs" element={
            <PermissionRoute permission="audit:read">
              <AuditLogs />
            </PermissionRoute>
          } />
          
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Area Layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
