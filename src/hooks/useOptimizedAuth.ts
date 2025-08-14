import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuthCache } from './useAuthCache';
import { useSessionMonitor } from './useSessionMonitor';

interface OptimizedAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export function useOptimizedAuth() {
  const [state, setState] = useState<OptimizedAuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isInitialized: false
  });

  const cache = useAuthCache();
  const sessionMonitor = useSessionMonitor();
  const initializationRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const updateAuthState = useCallback((session: Session | null, user: User | null = null) => {
    const finalUser = user || session?.user || null;
    
    setState(prev => ({
      ...prev,
      session,
      user: finalUser,
      loading: false,
      error: null
    }));

    // Update cache
    if (session) {
      cache.setSessionCache(session);
      sessionMonitor.startMonitoring(session);
    }
    if (finalUser) {
      cache.setUserCache(finalUser);
      cache.preloadUserData(finalUser.id);
    }
  }, [cache, sessionMonitor]);

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

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, session?.user?.email);
          
          if (event === 'SIGNED_OUT') {
            cache.clearCache();
            sessionMonitor.stopMonitoring();
            setState(prev => ({
              ...prev,
              user: null,
              session: null,
              loading: false,
              error: null
            }));
          } else if (session) {
            updateAuthState(session);
          }
        }
      );

      unsubscribeRef.current = subscription.unsubscribe;

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState(prev => ({ ...prev, error: error.message, loading: false }));
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
          redirectTo: `${window.location.origin}/app`
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
          isInitialized: true
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

  // Computed properties for backward compatibility
  const userRole = state.user?.user_metadata?.role || state.user?.app_metadata?.role || null;
  const isAdmin = userRole === 'admin';
  const isAuthenticated = !!state.user;

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
    userRole,
    isAdmin,
    isAuthenticated,
    getSessionTimeLeft: () => sessionMonitor.sessionHealth.expiresIn,
    isSessionExpired: () => !sessionMonitor.sessionHealth.isHealthy,
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