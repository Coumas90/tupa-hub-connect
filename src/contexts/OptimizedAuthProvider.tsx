import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRoleQuery, useInvalidateUserRole } from '@/utils/authQueries';
import { useAuthCache } from '@/hooks/useAuthCache';

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
  
  // Auth cache for session persistence
  const sessionCache = useAuthCache<Session>({ defaultTtl: 55 * 60 * 1000 }); // 55 minutes (slightly less than token expiry)
  
  // Role cache invalidation
  const invalidateUserRole = useInvalidateUserRole();
  
  // Single auth state change listener reference
  const authListenerRef = useRef<{ subscription: any } | null>(null);

  // React Query for role data with automatic caching
  const { 
    data: roleData, 
    isLoading: roleLoading, 
    error: roleError,
    refetch: refetchRole 
  } = useUserRoleQuery(authState.user?.id || null);

  // Update auth state when role data changes
  useEffect(() => {
    if (roleData && authState.user) {
      setAuthState(prev => ({
        ...prev,
        userRole: roleData.role,
        isAdmin: roleData.isAdmin,
        loading: false
      }));
    }
  }, [roleData, authState.user]);

  // Redirect user based on role
  const redirectByRole = useCallback((role: string | null, isAdmin: boolean) => {
    if (!role) {
      console.warn('No role found, redirecting to login');
      navigate('/auth');
      return;
    }

    const currentPath = location.pathname;
    
    // Admin users always go to admin panel
    if (isAdmin && !currentPath.startsWith('/admin')) {
      console.info('🔄 OptimizedAuth: Redirecting admin to admin panel...');
      navigate('/admin');
      return;
    }
    
    // Role-based redirects for non-admin users
    switch (role.toLowerCase()) {
      case 'client':
        if (!currentPath.startsWith('/app') && !isAdmin) {
          navigate('/app');
        }
        break;
      case 'barista':
        if (!currentPath.startsWith('/recipes') && !isAdmin) {
          navigate('/recipes');
        }
        break;
      default:
        if (!isAdmin) {
          console.warn(`Unknown role: ${role}, redirecting to dashboard`);
          navigate('/app');
        }
    }
  }, [navigate, location.pathname]);

  // Session management utilities
  const isSessionExpired = useCallback(() => {
    if (!authState.session) return true;
    
    const expiresAt = authState.session.expires_at;
    if (!expiresAt) return false;
    
    // Add 60 second buffer
    return (expiresAt * 1000) <= (Date.now() + 60000);
  }, [authState.session]);

  const getSessionTimeLeft = useCallback(() => {
    if (!authState.session?.expires_at) return 0;
    return Math.max(0, (authState.session.expires_at * 1000) - Date.now());
  }, [authState.session]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    if (authState.user?.id) {
      invalidateUserRole(authState.user.id);
    }
    sessionCache.clear();
  }, [authState.user?.id, invalidateUserRole, sessionCache]);

  // SINGLE auth state change listener
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
          
          // Cache the session
          sessionCache.set('current', session);
          
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session,
            loading: roleLoading, // Will be false when role query completes
            error: null,
          }));
          
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
          
          // Update cached session
          sessionCache.set('current', session);
          
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
          }));
        }
      }
    );

    authListenerRef.current = { subscription };

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.subscription.unsubscribe();
      }
    };
  }, [roleLoading, sessionCache, invalidateCache, navigate]);

  // Redirect when role data is available
  useEffect(() => {
    if (roleData && authState.user && !roleLoading) {
      // Small delay to ensure state is updated
      setTimeout(() => redirectByRole(roleData.role, roleData.isAdmin), 100);
    }
  }, [roleData, authState.user, roleLoading, redirectByRole]);

  // Initial session check with cache
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        // Try to get cached session first
        const cachedSession = sessionCache.get('current');
        
        if (cachedSession && !isSessionExpired()) {
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
  }, [sessionCache, isSessionExpired]);

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      
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
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Error al cerrar sesión' 
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const refreshUserData = async () => {
    if (!authState.user?.id) return;
    
    console.info('🔄 OptimizedAuth: Refreshing user data...');
    await refetchRole();
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
      {children}
    </OptimizedAuthContext.Provider>
  );
}