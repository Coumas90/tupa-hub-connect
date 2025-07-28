import React, { createContext, useContext, useEffect, useState } from 'react';
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
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
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

  // Get user role from database
  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      console.info('🔍 AuthContext: Fetching role for user:', userId);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ AuthContext: Error fetching user role:', error);
        return null;
      }

      console.info('✅ AuthContext: User role data:', data);
      return data?.role || null;
    } catch (error) {
      console.error('❌ AuthContext: Error in getUserRole:', error);
      return null;
    }
  };

  // Check if user has admin role
  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      console.info('🔍 AuthContext: Checking admin role for user:', userId);
      
      // Method 1: Try is_admin function
      const { data: isAdminFunc, error: funcError } = await supabase.rpc('is_admin', {
        _user_id: userId
      });
      
      if (!funcError && isAdminFunc !== null) {
        console.info('✅ AuthContext: is_admin() function returned:', isAdminFunc);
        return isAdminFunc;
      }
      
      console.warn('⚠️ AuthContext: is_admin() function failed, trying direct query:', funcError?.message);

      // Method 2: Direct query as fallback
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error('❌ AuthContext: Direct admin check failed:', roleError);
        return false;
      }

      const hasAdminRole = !!roleData;
      console.info('✅ AuthContext: Direct admin check result:', hasAdminRole);
      return hasAdminRole;
    } catch (error) {
      console.error('❌ AuthContext: Error in checkAdminRole:', error);
      return false;
    }
  };

  // Redirect user based on role
  const redirectByRole = (role: string | null) => {
    if (!role) {
      console.warn('No role found, redirecting to login');
      navigate('/auth');
      return;
    }

    const currentPath = location.pathname;
    
    // Don't redirect if already on correct path
    switch (role.toLowerCase()) {
      case 'admin':
        if (!currentPath.startsWith('/admin')) {
          navigate('/admin');
        }
        break;
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
        console.warn(`Unknown role: ${role}, redirecting to dashboard`);
        navigate('/app');
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // User just logged in, fetch their role and admin status
          console.info('🔄 AuthContext: User signed in, fetching role and admin status...');
          const role = await getUserRole(session.user.id);
          const isAdmin = await checkAdminRole(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            isAdmin,
            loading: false,
            error: null,
          });

          console.info('✅ AuthContext: User state updated:', { role, isAdmin });
          
          // Only redirect if not already on admin path and user is admin
          if (isAdmin && !location.pathname.startsWith('/admin')) {
            console.info('🔄 AuthContext: Redirecting admin to admin panel...');
            setTimeout(() => navigate('/admin'), 100);
          } else if (role && !isAdmin) {
            setTimeout(() => redirectByRole(role), 100);
          }
          
        } else if (event === 'SIGNED_OUT') {
          // User logged out
          console.info('🔄 AuthContext: User signed out');
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
          // Token refreshed, maintain current state but check admin status
          console.info('🔄 AuthContext: Token refreshed');
          const isAdmin = session.user ? await checkAdminRole(session.user.id) : false;
          
          setAuthState(prev => ({
            ...prev,
            session,
            user: session.user,
            isAdmin,
            loading: false,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

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
          console.info('🔍 AuthContext: Initial session found, checking role and admin status...');
          const role = await getUserRole(session.user.id);
          const isAdmin = await checkAdminRole(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            isAdmin,
            loading: false,
            error: null,
          });

          console.info('✅ AuthContext: Initial state set:', { role, isAdmin });
        } else {
          console.info('🔍 AuthContext: No initial session found');
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
  }, []);

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

  const refreshAdminStatus = async () => {
    if (!authState.session?.user) return;
    
    console.info('🔄 AuthContext: Refreshing admin status...');
    const isAdmin = await checkAdminRole(authState.session.user.id);
    
    setAuthState(prev => ({
      ...prev,
      isAdmin
    }));
    
    console.info('✅ AuthContext: Admin status refreshed:', isAdmin);
  };

  const contextValue: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    clearError,
    refreshAdminStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}