import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkAndRefreshSession } from '@/utils/authGuard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAdmin?: boolean;
  showLoadingFallback?: boolean;
}

/**
 * Protected Route component that validates authentication before rendering children
 * Uses authGuard helper for session validation and token refresh
 */
export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/auth',
  requireAdmin = false,
  showLoadingFallback = true
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateAccess() {
      try {
        setLoading(true);
        setError(null);
        setIsValidating(true);

        console.info('🔒 ProtectedRoute: Validating access...', {
          path: location.pathname,
          requireAdmin,
          timestamp: new Date().toISOString()
        });

        // Use authGuard helper to validate and refresh session
        const validSession = await checkAndRefreshSession();

        if (!isMounted) return;

        if (!validSession?.user) {
          console.warn('❌ ProtectedRoute: No valid session, redirecting to login', {
            redirectTo,
            currentPath: location.pathname
          });

          // Store current path for redirect after login
          navigate(redirectTo, {
            replace: true,
            state: { 
              returnTo: location.pathname,
              message: 'Se requiere autenticación para acceder a esta página'
            }
          });
          return;
        }

        // Check admin requirements if needed
        if (requireAdmin) {
          const isAdmin = await checkAdminRole(validSession);
          if (!isAdmin) {
            console.warn('❌ ProtectedRoute: Admin access required but user lacks permissions');
            setError('Se requieren permisos de administrador para acceder a esta página');
            
            // Redirect to dashboard or unauthorized page
            navigate('/', {
              replace: true,
              state: { 
                message: 'No tienes permisos para acceder a esta página',
                type: 'error'
              }
            });
            return;
          }
        }

        console.info('✅ ProtectedRoute: Access granted', {
          userId: validSession.user.id,
          email: validSession.user.email,
          isAdmin: requireAdmin ? await checkAdminRole(validSession) : null
        });

        setSession(validSession);
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Error de validación de acceso';
        console.error('❌ ProtectedRoute: Validation error:', errorMessage);
        
        setError(errorMessage);
        
        // On critical errors, redirect to login for security
        navigate(redirectTo, {
          replace: true,
          state: { 
            returnTo: location.pathname,
            error: errorMessage
          }
        });
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsValidating(false);
        }
      }
    }

    validateAccess();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, redirectTo, requireAdmin]);

  // Show loading state while validating
  if (loading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showLoadingFallback) {
      return <LoadingSkeleton />;
    }

    return null;
  }

  // Show error state if validation failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show validating indicator for better UX
  if (isValidating) {
    return (
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Validando sesión...</span>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Render children if session is valid
  if (session?.user) {
    return <>{children}</>;
  }

  // Fallback - should not reach here normally
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Acceso restringido. Redirigiendo...
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Loading skeleton component for protected routes
 */
function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </div>
      
      <div className="grid gap-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[150px] rounded-lg" />
          <Skeleton className="h-[150px] rounded-lg" />
        </div>
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Check if user has admin role using secure database function
 */
async function checkAdminRole(session: Session): Promise<boolean> {
  if (!session?.user) return false;
  
  try {
    const { data, error } = await supabase.rpc('is_admin', { 
      _user_id: session.user.id 
    });
    
    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Admin-specific protected route component
 */
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requireAdmin'>) {
  return (
    <ProtectedRoute {...props} requireAdmin={true}>
      {children}
    </ProtectedRoute>
  );
}