import React, { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useOrgAccess, useUserWithRole } from '@/hooks/useUserWithRole';
import { ContextualLoading } from '@/components/ui/loading-states';

interface TenantRouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRole?: 'owner' | 'manager' | 'barista';
}

/**
 * Guard para rutas de tenant específico (/org/:orgSlug/*)
 * Valida que el usuario pertenezca a la organización correcta
 */
export function TenantRouteGuard({ 
  children, 
  fallback = null,
  requiredRole 
}: TenantRouteGuardProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user, role, orgId, isAdmin, isLoading } = useUserWithRole();
  const { canAccess, reason } = useOrgAccess(orgId);

  // Show loading state
  if (isLoading) {
    return fallback || <ContextualLoading type="auth" message="Validando acceso..." />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users should go to admin panel
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // User doesn't belong to this organization
  if (!canAccess) {
    if (reason === 'wrong_org') {
      return <Navigate to="/unauthorized" state={{ 
        message: "No tienes acceso a esta organización" 
      }} replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  // Check specific role requirement
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/org/${orgSlug}/dashboard`} state={{
      message: "No tienes permisos para acceder a esta sección"
    }} replace />;
  }

  return <>{children}</>;
}

/**
 * Guard específico para rutas de owner
 */
export function OwnerRouteGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <TenantRouteGuard requiredRole="owner" fallback={fallback}>
      {children}
    </TenantRouteGuard>
  );
}

/**
 * Guard específico para rutas de staff (manager + barista)
 */
export function StaffRouteGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { role } = useUserWithRole();
  
  if (role !== 'manager' && role !== 'barista') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <TenantRouteGuard fallback={fallback}>
      {children}
    </TenantRouteGuard>
  );
}