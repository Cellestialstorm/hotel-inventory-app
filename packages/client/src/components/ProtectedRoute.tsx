import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@hotel-inventory/shared';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' state= {{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== UserRole.ADMIN) {
    toast.error('Access Denied: Admin role required.');
    return <Navigate to='/dashboard' replace />;
  }

  return children;
};

export default ProtectedRoute;
