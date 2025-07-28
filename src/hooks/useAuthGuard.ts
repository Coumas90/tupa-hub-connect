import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkAndRefreshSession } from '@/utils/authGuard';
import { supabase } from '@/integrations/supabase/client';
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
export function useAdminGuard(redirectTo?: string): UseAuthGuardReturn & { isAdmin: boolean; adminCheckError?: string | null } {
  const authState = useAuthGuard({
    requireAuth: true,
    redirectTo,
    publicRoutes: ['/auth', '/']
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminRole() {
      if (!authState.session?.user) {
        console.info('🔐 useAdminGuard: No session/user, setting isAdmin to false');
        setIsAdmin(false);
        setAdminCheckError(null);
        return;
      }

      const userId = authState.session.user.id;
      console.info('🔐 useAdminGuard: Checking admin role for user:', userId);

      try {
        setAdminCheckError(null);

        // Method 1: Try the is_admin function first
        console.info('🔐 useAdminGuard: Trying is_admin() function...');
        const { data: isAdminFunc, error: funcError } = await supabase.rpc('is_admin', {
          _user_id: userId
        });
        
        if (!funcError && isAdminFunc !== null) {
          console.info('✅ useAdminGuard: is_admin() function returned:', isAdminFunc);
          setIsAdmin(isAdminFunc);
          return;
        }
        
        console.warn('⚠️ useAdminGuard: is_admin() function failed:', funcError?.message);

        // Method 2: Direct query to user_roles table as fallback
        console.info('🔐 useAdminGuard: Trying direct query to user_roles...');
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) {
          console.error('❌ useAdminGuard: Direct role query failed:', roleError);
          setAdminCheckError(`Role query failed: ${roleError.message}`);
          setIsAdmin(false);
          return;
        }

        const hasAdminRole = !!roleData;
        console.info('✅ useAdminGuard: Direct query result - has admin role:', hasAdminRole);
        setIsAdmin(hasAdminRole);

        if (!hasAdminRole) {
          console.warn('❌ useAdminGuard: User lacks admin privileges');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ useAdminGuard: Admin role check failed:', errorMessage);
        setAdminCheckError(`Admin check failed: ${errorMessage}`);
        setIsAdmin(false);
      }
    }
    
    checkAdminRole();
  }, [authState.session]);

  // Add debug information to the return value
  const debugInfo = {
    sessionExists: !!authState.session,
    userExists: !!authState.session?.user,
    userId: authState.session?.user?.id,
    adminCheckError,
    authLoading: authState.loading,
    authError: authState.error
  };

  console.info('🔐 useAdminGuard: Current state:', { 
    isAdmin, 
    isAuthenticated: authState.isAuthenticated, 
    loading: authState.loading,
    debugInfo 
  });

  return {
    ...authState,
    isAdmin,
    adminCheckError
  };
}