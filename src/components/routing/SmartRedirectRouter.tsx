import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserWithRole } from '@/hooks/useUserWithRole';
import { ContextualLoading } from '@/components/ui/loading-states';

/**
 * Router inteligente que redirige automáticamente al panel correcto
 * según el rol y contexto del usuario autenticado
 */
export function SmartRedirectRouter() {
  const { user, isAdmin, orgSlug, role, isLoading } = useUserWithRole();

  // Loading state
  if (isLoading) {
    return <ContextualLoading type="auth" message="Detectando contexto de usuario..." />;
  }

  // No authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin users go to admin panel
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Users without organization go to onboarding
  if (!orgSlug) {
    return <Navigate to="/onboarding" replace />;
  }

  // Tenant users go to their specific panel
  switch (role) {
    case 'owner':
      return <Navigate to={`/org/${orgSlug}/owner/dashboard`} replace />;
    case 'manager':
    case 'barista':
      return <Navigate to={`/org/${orgSlug}/staff/dashboard`} replace />;
    default:
      return <Navigate to={`/org/${orgSlug}/dashboard`} replace />;
  }
}

/**
 * Componente para mostrar cuando un usuario intenta acceder a rutas no autorizadas
 */
export function UnauthorizedAccess() {
  const { isAdmin, orgSlug } = useUserWithRole();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-destructive">Acceso No Autorizado</h1>
          <p className="mt-4 text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Volver Atrás
          </button>
          
          <Navigate 
            to={isAdmin ? "/admin/dashboard" : `/org/${orgSlug}/dashboard`} 
            replace 
          />
        </div>
      </div>
    </div>
  );
}