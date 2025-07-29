import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { ROUTE_PERMISSIONS, UserRole } from '@/constants/routes';
import { ContextualLoading } from '@/components/ui/loading-states';
import { ErrorState, RoleBasedError } from '@/components/ui/error-states';

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAdmin?: boolean;
  loadingMessage?: string;
}

interface RouteGuardProps {
  permission: keyof typeof ROUTE_PERMISSIONS;
  children: ReactNode;
  fallback?: ReactNode;
  loadingMessage?: string;
}

/**
 * Enhanced Role Guard with intelligent UX and proper role validation
 */
export function RoleGuard({ 
  roles, 
  children, 
  fallback, 
  requireAdmin = false,
  loadingMessage 
}: RoleGuardProps) {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    userRole,
    isAdmin,
    loading,
    hasRole,
    hasAnyRole
  } = useEnhancedAuth();

  // Show contextual loading based on what's being checked
  if (loading) {
    const loadingType = requireAdmin ? 'admin' : 'role';
    return (
      <ContextualLoading 
        type={loadingType}
        message={loadingMessage}
      />
    );
  }

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return fallback || (
      <ErrorState
        type="auth"
        onAction={() => navigate('/auth')}
      />
    );
  }

  // Check admin requirement first
  if (requireAdmin && !isAdmin) {
    return fallback || (
      <ErrorState
        type="admin"
        userRole={userRole || 'unknown'}
        onAction={() => navigate(-1)}
      />
    );
  }

  // For admin users, allow access to all routes
  if (isAdmin) {
    return <>{children}</>;
  }

  // Enhanced role checking with better UX
  const roleStrings = roles.map(role => role.toLowerCase());
  
  // Check if user has any of the required roles
  const hasAccess = hasAnyRole(roleStrings) || 
    // Allow 'user' role for basic access to authenticated routes
    (roleStrings.includes('user') && ['client', 'barista', 'manager', 'owner'].includes(userRole?.toLowerCase() || ''));

  if (!hasAccess) {
    return fallback || (
      <RoleBasedError
        userRole={userRole || 'unknown'}
        requiredRoles={roleStrings}
        onNavigateBack={() => {
          // Smart navigation based on user role
          switch (userRole?.toLowerCase()) {
            case 'barista':
              navigate('/recipes');
              break;
            case 'client':
            case 'manager':
            case 'owner':
              navigate('/app');
              break;
            default:
              navigate('/');
          }
        }}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Simplified permission-based guard using predefined permission sets
 */
export function RouteGuard({ 
  permission, 
  children, 
  fallback, 
  loadingMessage 
}: RouteGuardProps) {
  const roles = [...ROUTE_PERMISSIONS[permission]] as UserRole[];
  const requireAdmin = permission === 'ADMIN_ONLY';
  
  return (
    <RoleGuard 
      roles={roles} 
      requireAdmin={requireAdmin} 
      fallback={fallback}
      loadingMessage={loadingMessage}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * Specific guard for admin-only routes with enhanced UX
 */
export function AdminGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <RouteGuard 
      permission="ADMIN_ONLY" 
      fallback={fallback}
      loadingMessage="Verificando permisos administrativos..."
    >
      {children}
    </RouteGuard>
  );
}

/**
 * Guard for management-level routes (owner, manager, admin)
 */
export function ManagementGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <RouteGuard 
      permission="MANAGEMENT" 
      fallback={fallback}
      loadingMessage="Validando permisos de gestión..."
    >
      {children}
    </RouteGuard>
  );
}

/**
 * Guard for all authenticated users with enhanced UX
 */
export function AuthenticatedGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode; 
  fallback?: ReactNode; 
}) {
  return (
    <RouteGuard 
      permission="ALL_AUTHENTICATED" 
      fallback={fallback}
      loadingMessage="Verificando autenticación..."
    >
      {children}
    </RouteGuard>
  );
}

/**
 * Smart guard that adapts based on user context and location access
 */
export function SmartGuard({ 
  children,
  requireLocationAccess = false,
  fallback 
}: { 
  children: ReactNode;
  requireLocationAccess?: boolean;
  fallback?: ReactNode;
}) {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    loading,
    hasLocationAccess,
    canAccessTenantFeatures,
    userRole
  } = useEnhancedAuth();

  if (loading) {
    return (
      <ContextualLoading 
        type="location"
        message="Cargando contexto de ubicación..."
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorState
        type="auth"
        onAction={() => navigate('/auth')}
      />
    );
  }

  if (requireLocationAccess && !hasLocationAccess) {
    return fallback || (
      <ErrorState
        type="general"
        title="Ubicación No Configurada"
        message="Necesitas tener acceso a una ubicación para usar esta funcionalidad."
        actionLabel="Ir al Dashboard"
        onAction={() => navigate('/app')}
        userRole={userRole || 'unknown'}
      />
    );
  }

  return <>{children}</>;
}