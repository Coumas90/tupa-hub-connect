import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { addAuthListener } from '@/lib/auth-effects';
import { useAuthCache } from './useAuthCache';
import { useSessionMonitor } from './useSessionMonitor';
import { getUserRole, getUserLocationContext, UserRole, RoleCheckResult } from '@/utils/authRoleUtils';
import { AuthMiddleware } from '@/middleware/authMiddleware';
import { toast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { sentryUtils } from '@/lib/sentry';
interface OptimizedAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
  
  // Enhanced state from FriendlyAuthProvider
  userRole: UserRole;
  roleSource: 'user_roles_table' | 'user_metadata' | 'app_metadata' | 'none';
  isAdmin: boolean;
  locationContext: any;
  authProgress: number;
  statusMessage: string;
  isReady: boolean;
}

export function useOptimizedAuth() {
  const [state, setState] = useState<OptimizedAuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isInitialized: false,
    userRole: null,
    roleSource: 'none',
    isAdmin: false,
    locationContext: null,
    authProgress: 0,
    statusMessage: 'Inicializando...',
    isReady: false
  });

  const navigate = useNavigate();
  const location = useLocation();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  const cache = useAuthCache();
  const sessionMonitor = useSessionMonitor();
  const initializationRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Progress animation helper
  const animateProgress = useCallback((target: number, message: string, duration: number = 1500) => {
    setState(prev => ({ ...prev, statusMessage: message }));
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const startProgress = state.authProgress;
    const step = (target - startProgress) / (duration / 50);

    progressIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newProgress = Math.min(prev.authProgress + step, target);
        if (newProgress >= target) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        return { ...prev, authProgress: newProgress };
      });
    }, 50);
  }, [state.authProgress]);

  const updateAuthState = useCallback(async (session: Session | null, user: User | null = null) => {
    const finalUser = user || session?.user || null;
    
    if (finalUser) {
      // Get comprehensive role information
      const roleResult = await getUserRole(finalUser);
      const locationContext = await getUserLocationContext(finalUser.id);
      
      setState(prev => ({
        ...prev,
        session,
        user: finalUser,
        userRole: roleResult.role,
        roleSource: roleResult.source,
        isAdmin: roleResult.isAdmin,
        locationContext,
        loading: false,
        error: null,
        isReady: true
      }));

      sentryUtils.setUser({ id: finalUser.id, email: finalUser.email || undefined });
      sentryUtils.setTag('user.role', roleResult.role || 'unknown');
      sentryUtils.addBreadcrumb('Auth state updated','auth',{ role: roleResult.role, source: roleResult.source });

      // Redirection handled outside via SmartRedirectRouter

    } else {
      setState(prev => ({
        ...prev,
        session: null,
        user: null,
        userRole: null,
        roleSource: 'none',
        isAdmin: false,
        locationContext: null,
        loading: false,
        authProgress: 0,
        statusMessage: 'Sin sesión',
        isReady: false
      }));
    }

    // Update cache
    if (session) {
      cache.setSessionCache(session);
      sessionMonitor.startMonitoring(session);
    }
    if (finalUser) {
      cache.setUserCache(finalUser);
      cache.preloadUserData(finalUser.id);
    }
  }, [cache, sessionMonitor, location.pathname, navigate]);

  const initializeAuth = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      // Try cache first for faster initial load
      const cachedSession = cache.getCachedSession();
      const cachedUser = cache.getCachedUser();

      if (cachedSession && cachedUser) {
        setState(prev => ({
          ...prev,
          session: cachedSession,
          user: cachedUser,
          loading: false,
          isInitialized: true
        }));
        sessionMonitor.startMonitoring(cachedSession);
      }

      // Set up centralized auth events listener
      const removeAuthListener = addAuthListener((event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        sentryUtils.addBreadcrumb(`Auth event: ${event}`,'auth',{ email: session?.user?.email });
        if (event === 'SIGNED_OUT') {
          cache.clearCache();
          sessionMonitor.stopMonitoring();
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            userRole: null,
            roleSource: 'none',
            isAdmin: false,
            locationContext: null,
            loading: false,
            error: null,
            authProgress: 0,
            statusMessage: 'Desconectado',
            isReady: false
          }));
          navigate('/login', { replace: true });
        } else if (session) {
          // Defer async fetches to avoid deadlocks in callback
          setTimeout(() => {
            updateAuthState(session);
          }, 0);
        }
      });

      unsubscribeRef.current = removeAuthListener;

      // Get current session if not cached
      if (!cachedSession) {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({
            ...prev,
            error: error.message,
            loading: false,
            isInitialized: true
          }));
        } else {
          updateAuthState(session);
          setState(prev => ({ ...prev, isInitialized: true }));
        }
      } else {
        setState(prev => ({ ...prev, isInitialized: true }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication error',
        loading: false,
        isInitialized: true
      }));
    }
  }, [cache, sessionMonitor, updateAuthState]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      sentryUtils.addBreadcrumb('Sign in attempt','auth',{ email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        sentryUtils.captureMessage(`Sign in failed: ${error.message}`,'error',{ email });
        return { error };
      }

      updateAuthState(data.session, data.user);
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      return { error: new Error(message) };
    }
  }, [updateAuthState]);

  const signInWithGoogle = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
        return { error };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign in failed';
      setState(prev => ({ ...prev, error: message, loading: false }));
      return { error: new Error(message) };
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
      } else {
        cache.clearCache();
        sessionMonitor.stopMonitoring();
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
          isInitialized: true,
          userRole: null,
          roleSource: 'none',
          isAdmin: false,
          locationContext: null,
          authProgress: 0,
          statusMessage: 'Desconectado',
          isReady: false
        });
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false
      }));
    }
  }, [cache, sessionMonitor]);

  const refreshSession = useCallback(async () => {
    return await sessionMonitor.refreshSession();
  }, [sessionMonitor]);

  useEffect(() => {
    initializeAuth();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      sessionMonitor.stopMonitoring();
    };
  }, [initializeAuth, sessionMonitor]);

  // Session utilities for backward compatibility
  const isAuthenticated = !!state.user;
  const isSessionExpired = useCallback(() => {
    if (!state.session?.expires_at) return true;
    return (state.session.expires_at * 1000) <= (Date.now() + 60000);
  }, [state.session?.expires_at]);

  const getSessionTimeLeft = useCallback(() => {
    if (!state.session?.expires_at) return 0;
    return Math.max(0, (state.session.expires_at * 1000) - Date.now());
  }, [state.session?.expires_at]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    refreshSession,
    sessionHealth: sessionMonitor.sessionHealth,
    cacheStats: cache.cacheStats,
    clearError: () => setState(prev => ({ ...prev, error: null })),
    // Backward compatibility properties
    isAuthenticated,
    getSessionTimeLeft,
    isSessionExpired,
    refreshUserData: async () => {
      if (state.user) {
        await cache.preloadUserData(state.user.id);
      }
    }
  };
}

// Re-export the required hooks
export { useRequireAdmin } from './useRequireAdmin';
export { useRequireAuth } from './useRequireAuth';