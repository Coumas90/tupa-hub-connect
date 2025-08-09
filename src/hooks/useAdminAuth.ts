import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthMiddleware } from '@/middleware/authMiddleware';
import { Roles } from '@/constants/roles';

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
      const quickAdminCheck = auth.user?.user_metadata?.role === Roles.ADMIN || auth.user?.app_metadata?.role === Roles.ADMIN;

      if (auth.user && !auth.isAdmin && !quickAdminCheck) {
        // Non-admin users should go to client app
        navigate('/dashboard', { replace: true });
        return;
      }

      if (auth.user && (auth.isAdmin || quickAdminCheck)) {
        // Admin users - validate and redirect
        AuthMiddleware.validateRouteAccess(
          auth.user,
          auth.session,
          location.pathname,
          { requireAuth: true, adminOnly: true }
        ).then(validation => {
          if (validation.redirectTo && validation.redirectTo !== location.pathname) {
            if (validation.redirectTo.startsWith('/onboarding')) {
              navigate('/dashboard', { replace: true });
            } else {
              navigate(validation.redirectTo, { replace: true });
            }
          } else if (location.pathname.startsWith('/admin/login')) {
            navigate('/dashboard', { replace: true });
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