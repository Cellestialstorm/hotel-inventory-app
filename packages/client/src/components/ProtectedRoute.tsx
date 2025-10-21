import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const authToken = localStorage.getItem('authToken');

  if (!authToken || !currentUser.id) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && currentUser.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
