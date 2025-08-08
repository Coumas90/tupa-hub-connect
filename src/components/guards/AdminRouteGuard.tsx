import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ContextualLoading } from '@/components/ui/loading-states';

interface AdminRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Route guard specifically for admin users
 */
export function AdminRouteGuard({ 
  children, 
  fallback = null 
}: AdminRouteGuardProps) {
  const auth = useAdminAuth();
  const location = useLocation();

  // Show loading state
  if (auth.loading || !auth.isReady) {
    return fallback || <ContextualLoading type="admin" message={auth.statusMessage} />;
  }

  // Not authenticated - redirect to admin login
  if (!auth.isAuthenticated) {
    return <Navigate to="/admin/login" state={{ returnTo: location.pathname }} replace />;
  }

  // Non-admin users should not access admin routes
  if (!auth.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}