import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Check for admin token first (master key login)
  const nileAdminAuth = localStorage.getItem('nile_admin_auth');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e]"></div>
      </div>
    );
  }

  // Strict RBAC: Check admin auth token OR user role
  if ((!nileAdminAuth || nileAdminAuth !== 'true') && (!user || user.role !== 'admin')) {
    return <Navigate to="/admin/portal" replace />;
  }

  return <>{children}</>;
};
