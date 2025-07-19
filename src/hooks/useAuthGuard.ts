import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkAndRefreshSession } from '@/utils/authGuard';
import type { Session } from '@supabase/supabase-js';

interface UseAuthGuardReturn {
  loading: boolean;
  session: Session | null;
  isAuthenticated: boolean;
  error: string | null;
}

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  publicRoutes?: string[];
}

/**
 * Auth guard hook that validates session and protects private routes
 * @param options Configuration options for the auth guard
 * @returns Auth state and loading status
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardReturn {
  const {
    redirectTo = '/auth',
    requireAuth = true,
    publicRoutes = ['/auth', '/', '/faq']
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function validateAuth() {
      try {
        setLoading(true);
        setError(null);

        console.info('🔐 useAuthGuard: Validating authentication...', {
          currentPath: location.pathname,
          requireAuth,
          isPublicRoute: publicRoutes.includes(location.pathname)
        });

        // Check if current route is public and auth is not required
        if (!requireAuth || publicRoutes.includes(location.pathname)) {
          console.info('📖 Public route accessed, skipping auth validation');
          setLoading(false);
          return;
        }

        // Validate and refresh session if needed
        const validSession = await checkAndRefreshSession();

        if (!isMounted) return;

        if (validSession?.user) {
          console.info('✅ useAuthGuard: User authenticated', {
            userId: validSession.user.id,
            email: validSession.user.email
          });
          setSession(validSession);
        } else {
          console.warn('❌ useAuthGuard: No valid session found, redirecting to login');
          
          // Store the current path for redirect after login
          const returnTo = location.pathname !== redirectTo ? location.pathname : '/';
          
          // Navigate to login with return path
          navigate(redirectTo, { 
            replace: true,
            state: { returnTo }
          });
          
          setSession(null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Authentication validation failed';
        console.error('❌ useAuthGuard: Auth validation error:', errorMessage);
        
        setError(errorMessage);
        setSession(null);
        
        // On error, also redirect to login for security
        if (requireAuth && !publicRoutes.includes(location.pathname)) {
          navigate(redirectTo, { 
            replace: true,
            state: { returnTo: location.pathname, error: errorMessage }
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    validateAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate, redirectTo, requireAuth, publicRoutes]);

  return {
    loading,
    session,
    isAuthenticated: !!session?.user,
    error
  };
}

/**
 * Simplified auth guard hook for protecting pages that require authentication
 * @param redirectTo Optional redirect path (defaults to '/auth')
 */
export function useRequireAuth(redirectTo?: string): UseAuthGuardReturn {
  return useAuthGuard({
    requireAuth: true,
    redirectTo
  });
}

/**
 * Auth guard hook for pages that don't require authentication but need auth state
 * @param redirectTo Optional redirect path for when user wants to access auth-required features
 */
export function useOptionalAuth(redirectTo?: string): UseAuthGuardReturn {
  return useAuthGuard({
    requireAuth: false,
    redirectTo
  });
}

/**
 * Auth guard hook specifically for admin pages with additional role checking
 * @param redirectTo Optional redirect path (defaults to '/auth')
 */
export function useAdminGuard(redirectTo?: string): UseAuthGuardReturn & { isAdmin: boolean } {
  const authState = useAuthGuard({
    requireAuth: true,
    redirectTo,
    publicRoutes: ['/auth', '/']
  });

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user has admin role
    // This would typically involve checking user metadata or making an API call
    if (authState.session?.user) {
      // For now, we'll check if the user email contains 'admin' or has admin metadata
      const userEmail = authState.session.user.email;
      const userMetadata = authState.session.user.user_metadata;
      
      const hasAdminRole = userEmail?.includes('admin') || 
                          userMetadata?.role === 'admin' ||
                          userMetadata?.is_admin === true;
      
      setIsAdmin(hasAdminRole);
      
      if (!hasAdminRole && authState.session) {
        console.warn('❌ useAdminGuard: User lacks admin privileges');
        // Could redirect to unauthorized page or dashboard
      }
    } else {
      setIsAdmin(false);
    }
  }, [authState.session]);

  return {
    ...authState,
    isAdmin
  };
}