import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthMiddleware } from '@/middleware/authMiddleware';

export interface ClientAuthResult {
  user: any;
  session: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  userRole: string | null;
  locationContext: any;
  isReady: boolean;
  statusMessage: string;
  authProgress: number;
  
  // Client-specific auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Client-specific authentication hook
 * Handles authentication for cafe owners, managers, baristas, etc.
 */
export function useClientAuth(): ClientAuthResult {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Client-specific validation
  useEffect(() => {
    if (!auth.loading && auth.isInitialized && auth.user) {
      // Only allow non-admin users in client flow
      if (auth.isAdmin) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // Validate and redirect client users
      AuthMiddleware.validateRouteAccess(
        auth.user,
        auth.session,
        location.pathname,
        { requireAuth: true, tenantOnly: true, allowedRoles: ['owner', 'manager', 'barista', 'user'] }
      ).then(validation => {
        if (validation.redirectTo && validation.redirectTo !== location.pathname) {
          navigate(validation.redirectTo, { replace: true });
        }
      });
    }
  }, [auth.user, auth.loading, auth.isInitialized, auth.isAdmin, location.pathname, navigate]);

  // Client-specific sign out
  const clientSignOut = useCallback(async () => {
    await auth.signOut();
    navigate('/auth', { replace: true });
  }, [auth.signOut, navigate]);

  return {
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    userRole: auth.userRole,
    locationContext: auth.locationContext,
    isReady: auth.isReady,
    statusMessage: auth.statusMessage,
    authProgress: auth.authProgress,
    
    signInWithEmail: auth.signInWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: clientSignOut,
    clearError: auth.clearError,
  };
}