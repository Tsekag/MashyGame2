// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireUser?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireUser = false
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading component
  }

  // Check for admin access
  if (requireAdmin) {
    if (!user || user.role !== 'admin') {
      return <Navigate to="/" replace />; // Redirect to main login
    }
  }
  
  // Check for regular user access
  if (requireUser) {
    if (!user) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
