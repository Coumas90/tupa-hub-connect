import { ReactNode } from 'react';
import { useRequireAuth, useRequireAdmin } from '@/hooks/useOptimizedAuth';
import { ROUTE_PERMISSIONS, UserRole } from '@/constants/routes';

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAdmin?: boolean;
}

interface RouteGuardProps {
  permission: keyof typeof ROUTE_PERMISSIONS;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Enhanced Role Guard with proper type safety and admin checking
 */
export function RoleGuard({ roles, children, fallback, requireAdmin = false }: RoleGuardProps) {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const { isAdmin, loading: adminLoading } = useRequireAdmin();
  
  const loading = authLoading || adminLoading;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Auth guard will handle redirect
  }

  // Check admin requirement first
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground">
            You need administrator privileges to access this area.
          </p>
        </div>
      </div>
    );
  }

  // For admin users, allow access to all routes
  if (isAdmin) {
    return <>{children}</>;
  }

  // TODO: Implement proper role checking from user profile
  // For now, allow authenticated users to access user-level routes
  const hasUserAccess = roles.includes('user' as UserRole) || roles.includes('barista' as UserRole);
  
  if (!hasUserAccess && !requireAdmin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Simplified permission-based guard using predefined permission sets
 */
export function RouteGuard({ permission, children, fallback }: RouteGuardProps) {
  const roles = [...ROUTE_PERMISSIONS[permission]] as UserRole[]; // Convert readonly to mutable
  const requireAdmin = permission === 'ADMIN_ONLY';
  
  return (
    <RoleGuard roles={roles} requireAdmin={requireAdmin} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Specific guard for admin-only routes
 */
export function AdminGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard permission="ADMIN_ONLY" fallback={fallback}>
      {children}
    </RouteGuard>
  );
}

/**
 * Guard for management-level routes (owner, manager, admin)
 */
export function ManagementGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard permission="MANAGEMENT" fallback={fallback}>
      {children}
    </RouteGuard>
  );
}

/**
 * Guard for all authenticated users
 */
export function AuthenticatedGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RouteGuard permission="ALL_AUTHENTICATED" fallback={fallback}>
      {children}
    </RouteGuard>
  );
}