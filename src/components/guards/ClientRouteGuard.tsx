import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';
import { ContextualLoading } from '@/components/ui/loading-states';

interface ClientRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireRole?: string;
}

/**
 * Route guard specifically for client (non-admin) users
 */
export function ClientRouteGuard({ 
  children, 
  fallback = null,
  requireRole 
}: ClientRouteGuardProps) {
  const auth = useClientAuth();
  const location = useLocation();

  // Show loading state
  if (auth.loading || !auth.isReady) {
    return fallback || <ContextualLoading type="auth" message={auth.statusMessage} />;
  }

  // Not authenticated - redirect to login
  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" state={{ returnTo: location.pathname }} replace />;
  }

  // Admin users should not access client routes through this guard
  if (auth.user?.user_metadata?.role === 'admin' || auth.user?.app_metadata?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Role-specific check if required
  if (requireRole && auth.userRole !== requireRole) {
    return fallback || <Navigate to="/app" replace />;
  }

  // User doesn't have location access and it's required
  if (!auth.locationContext && auth.userRole !== 'admin') {
    return <Navigate to="/onboarding/location" replace />;
  }

  return <>{children}</>;
}