import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRoleQuery, useInvalidateUserRole } from '@/utils/authQueries';
import { useAuthCache } from '@/hooks/useAuthCache';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface OptimizedAuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  // Performance helpers
  isSessionExpired: () => boolean;
  getSessionTimeLeft: () => number;
  invalidateCache: () => void;
}

const OptimizedAuthContext = createContext<OptimizedAuthContextType | undefined>(undefined);

export function useOptimizedAuth() {
  const context = useContext(OptimizedAuthContext);
  if (context === undefined) {
    throw new Error('useOptimizedAuth must be used within an OptimizedAuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function OptimizedAuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    userRole: null,
    isAdmin: false,
    loading: true,
    error: null,
  });

  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth cache for session persistence - Memoized to prevent re-creation
  const sessionCache = useAuthCache<Session>({ 
    defaultTtl: 55 * 60 * 1000, // 55 minutes (slightly less than token expiry)
    maxSize: 5 // Small cache for auth sessions
  });
  
  // Role cache invalidation
  const invalidateUserRole = useInvalidateUserRole();
  
  // Single auth state change listener reference
  const authListenerRef = useRef<{ subscription: any } | null>(null);

  // NOTE: React Query for roles is no longer needed as we get roles from user_metadata
  // Keeping minimal structure for compatibility
  const roleLoading = false;
  const roleError = null;

  // NOTE: Role data is now extracted directly from user_metadata in SIGNED_IN event
  // This useEffect is disabled as roles come from session.user.user_metadata.role
  // No longer need to wait for separate role query

  // Redirect user based on role - Optimized with performance tracking
  const redirectByRole = useCallback((role: string | null, isAdmin: boolean) => {
    const startTime = performance.now();
    
    if (!role) {
      console.warn('No role found, redirecting to login');
      navigate('/auth');
      return;
    }

    const currentPath = location.pathname;
    
    // Admin users always go to admin panel
    if (isAdmin && !currentPath.startsWith('/admin')) {
      console.info('🔄 OptimizedAuth: Redirecting admin to admin panel...', {
        from: currentPath,
        to: '/admin',
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      navigate('/admin');
      return;
    }
    
    // Role-based redirects for non-admin users with performance logging
    switch (role.toLowerCase()) {
      case 'client':
        if (!currentPath.startsWith('/app') && !isAdmin) {
          console.info('🔄 OptimizedAuth: Redirecting client to app', {
            from: currentPath,
            to: '/app',
            duration: `${(performance.now() - startTime).toFixed(2)}ms`
          });
          navigate('/app');
        }
        break;
      case 'barista':
        if (!currentPath.startsWith('/recipes') && !isAdmin) {
          console.info('🔄 OptimizedAuth: Redirecting barista to recipes', {
            from: currentPath,
            to: '/recipes',
            duration: `${(performance.now() - startTime).toFixed(2)}ms`
          });
          navigate('/recipes');
        }
        break;
      default:
        if (!isAdmin) {
          console.warn(`Unknown role: ${role}, redirecting to dashboard`, {
            from: currentPath,
            to: '/app',
            duration: `${(performance.now() - startTime).toFixed(2)}ms`
          });
          navigate('/app');
        }
    }
  }, [navigate, location.pathname]);

  // Session management utilities - Memoized to prevent infinite loops
  const isSessionExpired = useCallback(() => {
    if (!authState.session) return true;
    
    const expiresAt = authState.session?.expires_at;
    if (!expiresAt) return false;
    
    // Add 60 second buffer
    return (expiresAt * 1000) <= (Date.now() + 60000);
  }, [authState.session?.expires_at]);

  const getSessionTimeLeft = useCallback(() => {
    if (!authState.session?.expires_at) return 0;
    return Math.max(0, (authState.session.expires_at * 1000) - Date.now());
  }, [authState.session?.expires_at]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    if (authState.user?.id) {
      invalidateUserRole(authState.user.id);
    }
    sessionCache.clear();
  }, [authState.user?.id, invalidateUserRole, sessionCache]);

  // SINGLE auth state change listener with safeguards
  useEffect(() => {
    // Cleanup existing listener
    if (authListenerRef.current) {
      authListenerRef.current.subscription.unsubscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 OptimizedAuth: Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.info('🔄 OptimizedAuth: User signed in');
          
          // Only update if session or user actually changed
          const currentSession = authState.session;
          const sessionChanged = !currentSession || 
            currentSession.access_token !== session.access_token ||
            currentSession.user.id !== session.user.id;
          
          if (sessionChanged) {
            // Cache the session
            sessionCache.set('current', session);
            
            // Extract role directly from user_metadata (CRITICAL IMPROVEMENT)
            const userRole = session.user.user_metadata?.role || null;
            const isAdmin = userRole === 'admin';
            
            console.info('🔄 OptimizedAuth: Extracted role from metadata:', { userRole, isAdmin });
            
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              session,
              userRole,
              isAdmin,
              loading: false, // No need to wait for separate role query
              error: null,
            }));

            // Redirect immediately after setting state
            setTimeout(() => {
              redirectByRole(userRole, isAdmin);
            }, 100);
          }
          
        } else if (event === 'SIGNED_OUT') {
          console.info('🔄 OptimizedAuth: User signed out');
          
          // Clear caches
          sessionCache.clear();
          invalidateCache();
          
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
          
          navigate('/');
          
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.info('🔄 OptimizedAuth: Token refreshed');
          
          // Only update if token actually changed
          const currentSession = authState.session;
          const tokenChanged = !currentSession || 
            currentSession.access_token !== session.access_token;
          
          if (tokenChanged) {
            // Update cached session
            sessionCache.set('current', session);
            
            // Maintain role from user_metadata on token refresh
            const userRole = session.user.user_metadata?.role || null;
            const isAdmin = userRole === 'admin';
            
            setAuthState(prev => ({
              ...prev,
              session,
              user: session.user,
              userRole,
              isAdmin,
            }));
          }
        }
      }
    );

    authListenerRef.current = { subscription };

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.subscription.unsubscribe();
      }
    };
  }, [roleLoading, sessionCache, invalidateCache, navigate, authState.session]);

  // NOTE: Role-based redirects are now handled directly in SIGNED_IN event
  // No need for separate redirect effect since roles come from user_metadata

  // Initial session check with cache - Run only once on mount
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const checkInitialSession = async () => {
      try {
        // Try to get cached session first
        const cachedSession = sessionCache.get('current');
        const sessionExpired = cachedSession ? 
          !cachedSession.expires_at || (cachedSession.expires_at * 1000) <= (Date.now() + 60000) : 
          true;
        
        if (cachedSession && !sessionExpired) {
          console.info('🔍 OptimizedAuth: Using cached session');
          setAuthState(prev => ({
            ...prev,
            user: cachedSession.user,
            session: cachedSession,
          }));
          return;
        }

        // Fetch fresh session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState(prev => ({ 
            ...prev, 
            loading: false, 
            error: error.message 
          }));
          return;
        }

        if (session?.user) {
          console.info('🔍 OptimizedAuth: Fresh session found');
          
          // Cache the session
          sessionCache.set('current', session);
          
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
          }));
        } else {
          console.info('🔍 OptimizedAuth: No session found');
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error in initial session check:', error);
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Error initializing auth' 
        }));
      }
    };

    checkInitialSession();
  }, []); // Empty dependencies - run only once

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Enhanced Google OAuth with domain validation and better redirect handling
      const currentHost = window.location.host;
      const isProduction = !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1');
      
      const redirectTo = isProduction 
        ? `${window.location.origin}/`
        : `${window.location.origin}/`;

      console.info('🔄 OptimizedAuth: Google OAuth redirect to:', redirectTo);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        // Enhanced error classification
        if (error.message.includes('popup')) {
          throw new Error('popup_closed_by_user');
        } else if (error.message.includes('access_denied')) {
          throw new Error('access_denied');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Network error during Google authentication');
        }
        throw error;
      }
      
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error en login con Google' 
      }));
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
    } catch (error: any) {
      console.error('Email login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error en login' 
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.info('🔄 OptimizedAuth: Starting complete session cleanup...');
      setAuthState(prev => ({ ...prev, loading: true }));
      
      // 1. Clear Supabase session
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // 2. Clear all caches and storage
      console.info('🧹 OptimizedAuth: Clearing caches and localStorage...');
      
      // Clear React Query cache
      invalidateCache();
      
      // Clear localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-hmmaubkxfewzlypywqff-auth-token');
      localStorage.removeItem('auth_user_cache');
      localStorage.removeItem('session_cache');
      
      // Clear sessionStorage 
      sessionStorage.clear();
      
      // Clear any other auth-related storage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('supabase') || key.includes('session')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
      
      console.info('✅ OptimizedAuth: Session cleanup completed successfully');
      
    } catch (error: any) {
      console.error('❌ OptimizedAuth: Sign out error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cerrar sesión' 
      }));
      
      // Even if signOut fails, clear local state and redirect
      console.warn('⚠️ OptimizedAuth: Forcing local cleanup despite error');
      localStorage.clear();
      sessionStorage.clear();
      
      // Force redirect to login
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const refreshUserData = async () => {
    if (!authState.user?.id) return;
    
    const startTime = performance.now();
    console.info('🔄 OptimizedAuth: Refreshing user data...');
    
    try {
      // Get fresh session and extract role from user_metadata
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.user) {
        const userRole = session.user.user_metadata?.role || null;
        const isAdmin = userRole === 'admin';
        
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          userRole,
          isAdmin,
        }));
      }
      
      console.info('✅ OptimizedAuth: User data refreshed successfully', {
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
    } catch (error) {
      console.error('❌ OptimizedAuth: Failed to refresh user data:', error, {
        duration: `${(performance.now() - startTime).toFixed(2)}ms`
      });
      throw error;
    }
  };

  const contextValue: OptimizedAuthContextType = {
    ...authState,
    loading: authState.loading || roleLoading,
    error: authState.error || (roleError?.message || null),
    signInWithGoogle,
    signInWithEmail,
    signOut,
    clearError,
    refreshUserData,
    isSessionExpired,
    getSessionTimeLeft,
    invalidateCache,
  };

  return (
    <OptimizedAuthContext.Provider value={contextValue}>
      <AuthErrorBoundary>
        {children}
      </AuthErrorBoundary>
    </OptimizedAuthContext.Provider>
  );
}