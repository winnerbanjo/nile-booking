import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e]"></div>
      </div>
    );
  }

  // The backend-issued token and /auth/me are the authority. A localStorage
  // boolean is never sufficient to enter the admin portal.
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/portal" replace />;
  }

  return <>{children}</>;
};
