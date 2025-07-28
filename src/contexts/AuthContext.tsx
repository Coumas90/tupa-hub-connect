import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
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
    loading: true,
    error: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from database
  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
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
          // User just logged in, fetch their role and redirect
          const role = await getUserRole(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            loading: false,
            error: null,
          });

          // Redirect based on role
          setTimeout(() => redirectByRole(role), 100);
          
        } else if (event === 'SIGNED_OUT') {
          // User logged out
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            loading: false,
            error: null,
          });
          
          // Redirect to landing page
          navigate('/');
          
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed, maintain current state
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
          const role = await getUserRole(session.user.id);
          
          setAuthState({
            user: session.user,
            session,
            userRole: role,
            loading: false,
            error: null,
          });
        } else {
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

  const contextValue: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}