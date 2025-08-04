import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthMiddleware } from '@/middleware/authMiddleware';

export interface AdminAuthResult {
  user: any;
  session: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userRole: string | null;
  isReady: boolean;
  statusMessage: string;
  authProgress: number;
  
  // Admin-specific auth methods
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Admin-specific authentication hook
 * Handles authentication for admin users only
 */
export function useAdminAuth(): AdminAuthResult {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Admin-specific validation
  useEffect(() => {
    if (!auth.loading && auth.isInitialized) {
      if (auth.user && !auth.isAdmin) {
        // Non-admin users should go to client app
        navigate('/app', { replace: true });
        return;
      }

      if (auth.user && auth.isAdmin) {
        // Admin users - validate and redirect
        AuthMiddleware.validateRouteAccess(
          auth.user,
          auth.session,
          location.pathname,
          { requireAuth: true, adminOnly: true }
        ).then(validation => {
          if (validation.redirectTo && validation.redirectTo !== location.pathname) {
            navigate(validation.redirectTo, { replace: true });
          }
        });
      }
    }
  }, [auth.user, auth.loading, auth.isInitialized, auth.isAdmin, location.pathname, navigate]);

  // Admin-specific sign out
  const adminSignOut = useCallback(async () => {
    await auth.signOut();
    navigate('/admin/login', { replace: true });
  }, [auth.signOut, navigate]);

  return {
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    userRole: auth.userRole,
    isReady: auth.isReady,
    statusMessage: auth.statusMessage,
    authProgress: auth.authProgress,
    
    signInWithEmail: auth.signInWithEmail,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: adminSignOut,
    clearError: auth.clearError,
  };
}