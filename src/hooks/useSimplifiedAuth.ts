import { useAuth } from '@/contexts/OptimizedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Simplified authentication hook for direct login flow
 * Bypasses complex redirections and provides immediate dashboard access
 */
export function useSimplifiedAuth() {
  const auth = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = useCallback((user: any, userRole: string | null) => {
    // Admin users
    if (userRole === 'admin' || auth.isAdmin) {
      return '/admin/dashboard';
    }

    // Regular authenticated users go to main app
    return '/app';
  }, [auth.isAdmin]);

  const signInAndRedirect = useCallback(async (
    email: string, 
    password: string
  ) => {
    const { error } = await auth.signInWithEmail(email, password);
    
    if (!error && auth.user) {
      const redirectPath = getRedirectPath(auth.user, auth.userRole);
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    }
    
    return { error };
  }, [auth, navigate, getRedirectPath]);

  const signInWithGoogleAndRedirect = useCallback(async () => {
    const { error } = await auth.signInWithGoogle();
    
    if (!error && auth.user) {
      const redirectPath = getRedirectPath(auth.user, auth.userRole);
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    }
    
    return { error };
  }, [auth, navigate, getRedirectPath]);

  return {
    ...auth,
    signInAndRedirect,
    signInWithGoogleAndRedirect,
    getRedirectPath,
  };
}