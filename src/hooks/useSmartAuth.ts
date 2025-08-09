import { useState, useEffect, useCallback, useRef } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { checkAndRefreshSession } from '@/utils/authGuard';
import { toast } from '@/hooks/use-toast';
import { getAuthSession } from '@/utils/authCookies';

interface SmartAuthState {
  // Enhanced loading states
  isAuthenticating: boolean;
  isRedirecting: boolean;
  isCheckingPermissions: boolean;
  authProgress: number; // 0-100 for progress indication
  
  // Smart error handling
  lastError: string | null;
  errorType: 'auth' | 'google' | 'admin' | 'session' | 'network' | null;
  canRetry: boolean;
  
  // User-friendly status
  statusMessage: string;
  isReady: boolean; // True when auth is complete and user can proceed
}

interface SmartAuthOptions {
  requireAdmin?: boolean;
  autoRedirect?: boolean;
  enableProgressTracking?: boolean;
}

export function useSmartAuth(options: SmartAuthOptions = {}) {
  const {
    requireAdmin = false,
    autoRedirect = true,
    enableProgressTracking = true
  } = options;

  const optimizedAuth = useOptimizedAuth();
  const cookieSession = getAuthSession();

  const user = optimizedAuth.user ?? cookieSession?.user ?? null;
  const session = optimizedAuth.session ?? cookieSession ?? null;
  const { userRole, isAdmin, loading: authLoading, error, signInWithEmail, signInWithGoogle, signOut, clearError } = optimizedAuth;

  const navigate = useNavigate();
  const location = useLocation();
  
  const [smartState, setSmartState] = useState<SmartAuthState>({
    isAuthenticating: false,
    isRedirecting: false,
    isCheckingPermissions: false,
    authProgress: 0,
    lastError: null,
    errorType: null,
    canRetry: true,
    statusMessage: 'Inicializando...',
    isReady: false
  });

  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const authTimeoutRef = useRef<NodeJS.Timeout>();

  // Progress simulation for better UX
  const simulateProgress = useCallback((targetProgress: number, duration: number = 2000) => {
    if (!enableProgressTracking) return;
    
    const startProgress = smartState.authProgress;
    const progressStep = (targetProgress - startProgress) / (duration / 100);
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      setSmartState(prev => {
        const newProgress = Math.min(prev.authProgress + progressStep, targetProgress);
        if (newProgress >= targetProgress) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
        }
        return { ...prev, authProgress: newProgress };
      });
    }, 100);
  }, [smartState.authProgress, enableProgressTracking]);

  // Enhanced error classification
  const classifyError = useCallback((errorMessage: string): 'auth' | 'google' | 'admin' | 'session' | 'network' => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('popup') || message.includes('oauth') || message.includes('google')) {
      return 'google';
    }
    if (message.includes('admin') || message.includes('permission') || message.includes('access')) {
      return 'admin';
    }
    if (message.includes('session') || message.includes('token') || message.includes('expired')) {
      return 'session';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    return 'auth';
  }, []);

  // Smart authentication wrapper
  const smartSignIn = useCallback(async (method: 'email' | 'google', ...args: any[]) => {
    try {
      setSmartState(prev => ({
        ...prev,
        isAuthenticating: true,
        authProgress: 0,
        lastError: null,
        errorType: null,
        statusMessage: method === 'google' ? 'Conectando con Google...' : 'Validando credenciales...',
        canRetry: false
      }));

      simulateProgress(30, 1000);

      // Set timeout for auth operations
      authTimeoutRef.current = setTimeout(() => {
        setSmartState(prev => ({
          ...prev,
          lastError: 'La operación tardó demasiado. Intenta nuevamente.',
          errorType: 'network',
          canRetry: true,
          isAuthenticating: false
        }));
      }, 15000);

      let result;
      if (method === 'email') {
        result = await signInWithEmail(args[0], args[1]);
      } else {
        result = await signInWithGoogle();
      }

      simulateProgress(70, 800);

      // Clear timeout on success
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }

      setSmartState(prev => ({
        ...prev,
        statusMessage: 'Autenticación exitosa!',
        authProgress: 100,
        canRetry: true
      }));

      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Error de autenticación';
      const errorType = classifyError(errorMessage);

      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }

      setSmartState(prev => ({
        ...prev,
        isAuthenticating: false,
        lastError: errorMessage,
        errorType,
        canRetry: true,
        authProgress: 0,
        statusMessage: 'Error en autenticación'
      }));

      throw err;
    }
  }, [signInWithEmail, signInWithGoogle, simulateProgress, classifyError]);

  // Smart permission checking
  useEffect(() => {
    if (!authLoading && user && session) {
      setSmartState(prev => ({
        ...prev,
        isCheckingPermissions: true,
        statusMessage: 'Verificando permisos...'
      }));

      simulateProgress(85, 500);

      // Check admin requirements
      if (requireAdmin && !isAdmin) {
        setSmartState(prev => ({
          ...prev,
          isCheckingPermissions: false,
          lastError: 'Se requieren permisos de administrador',
          errorType: 'admin',
          statusMessage: 'Acceso denegado',
          isReady: false
        }));
        return;
      }

      // All checks passed
      setTimeout(() => {
        setSmartState(prev => ({
          ...prev,
          isCheckingPermissions: false,
          statusMessage: 'Listo!',
          authProgress: 100,
          isReady: true
        }));
      }, 300);
    }
  }, [authLoading, user, session, isAdmin, requireAdmin, simulateProgress]);

  // Handle auth errors from context
  useEffect(() => {
    if (error) {
      const errorType = classifyError(error);
      setSmartState(prev => ({
        ...prev,
        lastError: error,
        errorType,
        canRetry: true,
        isAuthenticating: false,
        isCheckingPermissions: false,
        statusMessage: 'Error detectado'
      }));
    }
  }, [error, classifyError]);

  // Smart retry mechanism
  const smartRetry = useCallback(async () => {
    if (!smartState.canRetry) return;

    clearError();
    setSmartState(prev => ({
      ...prev,
      lastError: null,
      errorType: null,
      canRetry: false,
      statusMessage: 'Reintentando...'
    }));

    try {
      // Try to refresh session for session errors
      if (smartState.errorType === 'session') {
        await checkAndRefreshSession();
      }
      
      setSmartState(prev => ({ ...prev, canRetry: true }));
    } catch (err) {
      console.error('Retry failed:', err);
      setSmartState(prev => ({
        ...prev,
        canRetry: true,
        lastError: 'No se pudo resolver el problema automáticamente'
      }));
    }
  }, [smartState.canRetry, smartState.errorType, clearError]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Original auth state
    user,
    session,
    userRole,
    isAdmin,
    loading: authLoading,
    
    // Enhanced smart state
    ...smartState,
    
    // Smart methods
    smartSignIn,
    smartRetry,
    signOut,
    clearError,
    
    // Utility flags
    isLoading: authLoading || smartState.isAuthenticating || smartState.isRedirecting || smartState.isCheckingPermissions,
    hasError: !!smartState.lastError,
    isAuthenticated: !!user && !!session,
  };
}