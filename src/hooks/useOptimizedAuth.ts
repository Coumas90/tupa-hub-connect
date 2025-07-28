import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import type { Session } from '@supabase/supabase-js';

interface UseOptimizedAuthGuardReturn {
  loading: boolean;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: string | null;
  error: string | null;
  // Performance utilities
  sessionTimeLeft: number;
  isSessionExpired: boolean;
  refreshUserData: () => Promise<void>;
}

interface UseOptimizedAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  publicRoutes?: string[];
}

/**
 * Optimized auth guard hook that consolidates authentication, role checking, and session management
 * Uses React Query for caching and deduplication
 */
export function useOptimizedAuthGuard(options: UseOptimizedAuthGuardOptions = {}): UseOptimizedAuthGuardReturn {
  const {
    redirectTo = '/auth',
    requireAuth = true,
    requireAdmin = false,
    publicRoutes = ['/auth', '/', '/faq']
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    user,
    session,
    userRole,
    isAdmin,
    loading,
    error,
    getSessionTimeLeft,
    isSessionExpired,
    refreshUserData
  } = useOptimizedAuth();

  const [guardLoading, setGuardLoading] = useState(true);
  const [guardError, setGuardError] = useState<string | null>(null);

  const sessionTimeLeft = getSessionTimeLeft();
  const sessionExpired = isSessionExpired();

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // Handle auth validation and redirects
  useEffect(() => {
    // Don't validate if auth is still loading
    if (loading) {
      setGuardLoading(true);
      return;
    }

    // Reset guard error
    setGuardError(null);

    // Skip validation for public routes when auth is not required
    if (!requireAuth && isPublicRoute) {
      console.info('📖 OptimizedAuthGuard: Public route accessed, skipping validation');
      setGuardLoading(false);
      return;
    }

    // Validate authentication requirement
    if (requireAuth && !session?.user) {
      console.warn('❌ OptimizedAuthGuard: Authentication required but no session found');
      
      // Store return path for redirect after login
      const returnTo = location.pathname !== redirectTo ? location.pathname : '/';
      
      navigate(redirectTo, { 
        replace: true,
        state: { returnTo }
      });
      
      setGuardLoading(false);
      return;
    }

    // Validate admin requirement
    if (requireAdmin && !isAdmin) {
      console.warn('❌ OptimizedAuthGuard: Admin access required but user is not admin');
      setGuardError('Se requieren permisos de administrador');
      
      // Redirect to appropriate dashboard based on role
      const fallbackRoute = userRole === 'client' ? '/app' : 
                           userRole === 'barista' ? '/recipes' : 
                           '/app';
      
      navigate(fallbackRoute, { replace: true });
      setGuardLoading(false);
      return;
    }

    // Validate session expiry
    if (session && sessionExpired) {
      console.warn('⏰ OptimizedAuthGuard: Session expired, redirecting to login');
      setGuardError('Sesión expirada');
      navigate(redirectTo, { replace: true });
      setGuardLoading(false);
      return;
    }

    // All validations passed
    if (session?.user) {
      console.info('✅ OptimizedAuthGuard: User authenticated and authorized', {
        userId: session.user.id,
        role: userRole,
        isAdmin,
        timeLeft: `${Math.floor(sessionTimeLeft / 1000 / 60)}min`
      });
    }

    setGuardLoading(false);
  }, [
    loading,
    session,
    userRole, 
    isAdmin,
    requireAuth,
    requireAdmin,
    isPublicRoute,
    sessionExpired,
    sessionTimeLeft,
    location.pathname,
    navigate,
    redirectTo
  ]);

  return {
    loading: loading || guardLoading,
    session,
    isAuthenticated: !!session?.user,
    isAdmin,
    userRole,
    error: error || guardError,
    sessionTimeLeft,
    isSessionExpired: sessionExpired,
    refreshUserData,
  };
}

/**
 * Simplified hook for pages that require authentication
 */
export function useRequireAuth(redirectTo?: string): UseOptimizedAuthGuardReturn {
  return useOptimizedAuthGuard({
    requireAuth: true,
    redirectTo
  });
}

/**
 * Hook for pages that require admin access
 */
export function useRequireAdmin(redirectTo?: string): UseOptimizedAuthGuardReturn {
  return useOptimizedAuthGuard({
    requireAuth: true,
    requireAdmin: true,
    redirectTo
  });
}

/**
 * Hook for pages that don't require authentication but benefit from auth state
 */
export function useOptionalAuth(): UseOptimizedAuthGuardReturn {
  return useOptimizedAuthGuard({
    requireAuth: false
  });
}

// Session monitor moved to separate hook file for better organization