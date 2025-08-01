import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface FriendlyAuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  
  // Friendly states
  authProgress: number;
  statusMessage: string;
  isReady: boolean;
}

interface FriendlyAuthContextType extends FriendlyAuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUserData: () => Promise<void>;
  
  // Session utilities
  isSessionExpired: () => boolean;
  getSessionTimeLeft: () => number;
}

const FriendlyAuthContext = createContext<FriendlyAuthContextType | undefined>(undefined);

export function useFriendlyAuth() {
  const context = useContext(FriendlyAuthContext);
  if (context === undefined) {
    throw new Error('useFriendlyAuth must be used within a FriendlyAuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function FriendlyAuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<FriendlyAuthState>({
    user: null,
    session: null,
    userRole: null,
    isAdmin: false,
    loading: true,
    error: null,
    authProgress: 0,
    statusMessage: 'Inicializando...',
    isReady: false,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const initRef = useRef(false);

  // Progress animation helper
  const animateProgress = useCallback((target: number, message: string, duration: number = 1500) => {
    setAuthState(prev => ({ ...prev, statusMessage: message }));
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const startProgress = authState.authProgress;
    const step = (target - startProgress) / (duration / 50);

    progressIntervalRef.current = setInterval(() => {
      setAuthState(prev => {
        const newProgress = Math.min(prev.authProgress + step, target);
        if (newProgress >= target) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        return { ...prev, authProgress: newProgress };
      });
    }, 50);
  }, [authState.authProgress]);

  // Smart redirect logic - simplified and faster
  const smartRedirect = useCallback((user: User, role: string | null, isAdmin: boolean) => {
    const currentPath = location.pathname;
    
    // Skip redirects for auth pages
    if (currentPath === '/auth' || currentPath === '/auth/reset') {
      return;
    }

    // Get return path from location state
    const returnTo = location.state?.returnTo;
    
    if (returnTo && returnTo !== '/auth') {
      navigate(returnTo, { replace: true });
      return;
    }

    // Simple role-based routing
    if (isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  }, [navigate, location]);

  // Session utilities
  const isSessionExpired = useCallback(() => {
    if (!authState.session?.expires_at) return true;
    return (authState.session.expires_at * 1000) <= (Date.now() + 60000);
  }, [authState.session?.expires_at]);

  const getSessionTimeLeft = useCallback(() => {
    if (!authState.session?.expires_at) return 0;
    return Math.max(0, (authState.session.expires_at * 1000) - Date.now());
  }, [authState.session?.expires_at]);

  // Main auth state listener - simplified
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 FriendlyAuth: State change:', event, !!session);

        if (event === 'SIGNED_IN' && session?.user) {
          animateProgress(60, 'Configurando permisos...', 800);
          
          // Extract role from user metadata immediately
          const userRole = session.user.user_metadata?.role || null;
          const isAdmin = userRole === 'admin';

          setTimeout(() => {
            animateProgress(90, 'Finalizando...', 500);
            
            setTimeout(() => {
              setAuthState(prev => ({
                ...prev,
                user: session.user,
                session,
                userRole,
                isAdmin,
                loading: false,
                authProgress: 100,
                statusMessage: 'Listo!',
                isReady: true,
                error: null,
              }));

              // Smart redirect after state is set
              setTimeout(() => smartRedirect(session.user, userRole, isAdmin), 200);
            }, 500);
          }, 800);

        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            userRole: null,
            isAdmin: false,
            loading: false,
            error: null,
            authProgress: 0,
            statusMessage: 'Desconectado',
            isReady: false,
          });
          
          navigate('/', { replace: true });

        } else if (event === 'TOKEN_REFRESHED' && session) {
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
    );

    return () => subscription.unsubscribe();
  }, [animateProgress, smartRedirect, navigate]);

  // Initial session check - only once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const checkInitialSession = async () => {
      try {
        animateProgress(30, 'Verificando sesión...', 1000);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          const userRole = session.user.user_metadata?.role || null;
          const isAdmin = userRole === 'admin';
          
          animateProgress(80, 'Sesión encontrada...', 800);
          
          setTimeout(() => {
            setAuthState(prev => ({
              ...prev,
              user: session.user,
              session,
              userRole,
              isAdmin,
              loading: false,
              authProgress: 100,
              statusMessage: 'Sesión restaurada',
              isReady: true,
            }));
          }, 800);
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            authProgress: 0,
            statusMessage: 'Sin sesión',
            isReady: false,
          }));
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Error al verificar sesión',
          authProgress: 0,
          statusMessage: 'Error de inicialización',
        }));
      }
    };

    checkInitialSession();
  }, [animateProgress]);

  // Auth methods
  const signInWithGoogle = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      animateProgress(20, 'Conectando con Google...', 1000);

      const redirectTo = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }
      });

      if (error) throw error;
      
    } catch (error: any) {
      console.error('Google login error:', error);
      
      let friendlyMessage = 'Error al conectar con Google';
      if (error.message.includes('popup')) {
        friendlyMessage = 'Ventana cerrada. Intenta nuevamente y mantén la ventana abierta.';
      } else if (error.message.includes('access_denied')) {
        friendlyMessage = 'Acceso denegado. Acepta los permisos para continuar.';
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: friendlyMessage,
        authProgress: 0,
        statusMessage: 'Error en Google Auth',
      }));

      toast({
        title: "Error en Google",
        description: friendlyMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      animateProgress(30, 'Validando credenciales...', 1200);

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        let friendlyMessage = 'Error al iniciar sesión';
        if (error.message.includes('Invalid login credentials')) {
          friendlyMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
          friendlyMessage = 'Confirma tu email antes de iniciar sesión';
        }
        throw new Error(friendlyMessage);
      }
      
    } catch (error: any) {
      console.error('Email login error:', error);
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        authProgress: 0,
        statusMessage: 'Error de autenticación',
      }));

      toast({
        title: "Error de Login",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      animateProgress(50, 'Cerrando sesión...', 800);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cerrar sesión',
      }));
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const refreshUserData = async () => {
    if (!authState.user?.id) return;
    
    try {
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
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const contextValue: FriendlyAuthContextType = {
    ...authState,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    clearError,
    refreshUserData,
    isSessionExpired,
    getSessionTimeLeft,
  };

  return (
    <FriendlyAuthContext.Provider value={contextValue}>
      {children}
    </FriendlyAuthContext.Provider>
  );
}