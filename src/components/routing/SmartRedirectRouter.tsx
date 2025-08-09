
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { ContextualLoading } from '@/components/ui/loading-states';
import { Roles } from '@/constants/roles';

/**
 * Router inteligente que redirige automáticamente al panel correcto
 * según el rol y contexto del usuario autenticado
 */
export function SmartRedirectRouter() {
  const { user, isAdmin, orgSlug, role, isLoading } = useUserWithRole();

  const quickAdminCheck = user?.user_metadata?.role === Roles.ADMIN || user?.app_metadata?.role === Roles.ADMIN;

  // No authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin users go to admin panel (either confirmed from DB or quick metadata check)
  if (isAdmin || quickAdminCheck) {
    return <Navigate to="/dashboard" replace />;
  }

  // Loading state for non-admin users
  if (isLoading) {
    return <ContextualLoading type="auth" message="Verificando acceso..." />;
  }

  // Users without organization context need onboarding
  if (!orgSlug) {
    return <Navigate to="/onboarding" replace />;
  }

  // Tenant users go to their specific panel based on role
  switch (role) {
    case Roles.OWNER:
      return <Navigate to={`/org/${orgSlug}/owner/dashboard`} replace />;
    case Roles.MANAGER:
      return <Navigate to={`/org/${orgSlug}/manager/dashboard`} replace />;
    case Roles.BARISTA:
      return <Navigate to={`/org/${orgSlug}/staff/dashboard`} replace />;
    case Roles.USER:
    default:
      return <Navigate to={`/org/${orgSlug}/dashboard`} replace />;
  }
}

/**
 * Componente para mostrar cuando un usuario intenta acceder a rutas no autorizadas
 */
export function UnauthorizedAccess() {
  const { isAdmin, orgSlug, role } = useUserWithRole();

  const getHomePath = () => {
    if (isAdmin) return "/dashboard";
    if (orgSlug) {
      switch (role) {
        case Roles.OWNER: return `/org/${orgSlug}/owner/dashboard`;
        case Roles.MANAGER: return `/org/${orgSlug}/manager/dashboard`;
        case Roles.BARISTA: return `/org/${orgSlug}/staff/dashboard`;
        default: return `/org/${orgSlug}/dashboard`;
      }
    }
    return "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6 p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
            <p className="mt-2 text-muted-foreground">
              No tienes permisos para acceder a esta sección del sistema.
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <Navigate to={getHomePath()} replace />
        </div>
      </div>
    </div>
  );
}
