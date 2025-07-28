import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
}

const OptimizedAuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Single optimized query for user role and admin status
  const getUserRoleAndAdminStatus = useCallback(async (userId: string): Promise<{ role: string | null; isAdmin: boolean }> => {
    try {
      console.info('🔍 OptimizedAuth: Fetching role and admin status for user:', userId);
      
      // Single query to get role information
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ OptimizedAuth: Error fetching user role:', error);
        return { role: null, isAdmin: false };
      }

      const role = data?.role || null;
      const isAdmin = role === 'admin';
      
      console.info('✅ OptimizedAuth: User data fetched:', { role, isAdmin });
      return { role, isAdmin };
    } catch (error) {
      console.error('❌ OptimizedAuth: Error in getUserRoleAndAdminStatus:', error);
      return { role: null, isAdmin: false };
    }
  }, []);

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
    
    // Don't redirect if already on correct path
    switch (role.toLowerCase()) {
      case 'client':
        if (!currentPath.startsWith('/app')) {
          navigate('/app');
        }
        break;
      case 'barista':
        if (!currentPath.startsWith('/recipes')) {
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

  // Refresh user data function
  const refreshUserData = useCallback(async () => {
    if (!authState.session?.user) return;
    
    console.info('🔄 OptimizedAuth: Refreshing user data...');
    const { role, isAdmin } = await getUserRoleAndAdminStatus(authState.session.user.id);
    
    setAuthState(prev => ({
      ...prev,
      userRole: role,
      isAdmin
    }));
    
    console.info('✅ OptimizedAuth: User data refreshed:', { role, isAdmin });
  }, [authState.session?.user, getUserRoleAndAdminStatus]);

  // Handle authentication state changes - SINGLE LISTENER
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 OptimizedAuth: Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // User just logged in, fetch their role and admin status in single query
          console.info('🔄 OptimizedAuth: User signed in, fetching user data...');
          const { role, isAdmin } = await getUserRoleAndAdminStatus(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            isAdmin,
            loading: false,
            error: null,
          });

          console.info('✅ OptimizedAuth: User state updated:', { role, isAdmin });
          
          // Handle redirect after state is set
          setTimeout(() => redirectByRole(role, isAdmin), 100);
          
        } else if (event === 'SIGNED_OUT') {
          // User logged out
          console.info('🔄 OptimizedAuth: User signed out');
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
          
          // Redirect to landing page
          navigate('/');
          
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, maintain current state - no need to refetch role
          console.info('🔄 OptimizedAuth: Token refreshed');
          
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
            loading: false,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [getUserRoleAndAdminStatus, redirectByRole, navigate]);

  // Initial session check
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
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
          console.info('🔍 OptimizedAuth: Initial session found, checking user data...');
          const { role, isAdmin } = await getUserRoleAndAdminStatus(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            isAdmin,
            loading: false,
            error: null,
          });

          console.info('✅ OptimizedAuth: Initial state set:', { role, isAdmin });
        } else {
          console.info('🔍 OptimizedAuth: No initial session found');
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
  }, [getUserRoleAndAdminStatus]);

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
      throw error; // Re-throw for component handling
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

  const contextValue: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    clearError,
    refreshUserData,
  };

  return (
    <OptimizedAuthContext.Provider value={contextValue}>
      {children}
    </OptimizedAuthContext.Provider>
  );
}