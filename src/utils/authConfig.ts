import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/browser';
import { toast } from '@/hooks/use-toast';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Track auth initialization to prevent duplicate listeners
let authListenersInitialized = false;

/**
 * Initialize authentication event listeners for enhanced security monitoring
 */
export function initializeAuthListeners() {
  if (authListenersInitialized) {
    console.warn('Auth listeners already initialized');
    return;
  }

  console.info('🔐 Initializing enhanced auth security listeners...');

  // Set up auth state change listener with comprehensive error handling
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event: AuthChangeEvent, session: Session | null) => {
      console.info(`🔄 Auth state change: ${event}`, {
        hasSession: !!session,
        userId: session?.user?.id || 'none',
        timestamp: new Date().toISOString()
      });

      switch (event) {
        case 'TOKEN_REFRESHED':
          console.info('✅ Token refreshed successfully');
          break;

        case 'SIGNED_IN':
          console.info('✅ User signed in successfully', {
            userId: session?.user?.id,
            email: session?.user?.email
          });
          break;

        case 'SIGNED_OUT':
          console.info('👋 User signed out');
          // Clear any cached data or reset app state if needed
          break;

        case 'PASSWORD_RECOVERY':
          console.info('🔐 Password recovery initiated');
          break;

        case 'USER_UPDATED':
          console.info('👤 User data updated');
          break;

        default:
          console.info(`🔄 Auth event: ${event}`);
      }

      // Handle token refresh failures - this is critical for security
      if (event === 'TOKEN_REFRESHED' && !session) {
        handleTokenRefreshFailure(session);
      }

      // Handle auth errors in the session (consolidated)
      if (session && (session as any).error) {
        const error = (session as any).error;
        handleAuthError(error, event, session);
      }
    }
  );

// Handle auth errors within the main listener (consolidated)
  // Error handling is now integrated in the main listener above

  authListenersInitialized = true;

  return () => {
    subscription.unsubscribe();
    authListenersInitialized = false;
  };
}

/**
 * Handle token refresh failures with comprehensive logging and user notification
 */
function handleTokenRefreshFailure(session: Session | null) {
  const error = new Error('Token refresh failed - session lost');
  
  console.error('❌ TOKEN_REFRESH_FAILED:', {
    timestamp: new Date().toISOString(),
    hasSession: !!session,
    userAgent: navigator.userAgent,
    url: window.location.href
  });

  // Capture with Sentry including user context
  Sentry.withScope((scope) => {
    scope.setTag('auth_event', 'TOKEN_REFRESH_FAILED');
    scope.setLevel('error');
    
    // Add user context if available
    if (session?.user) {
      scope.setUser({
        id: session.user.id,
        email: session.user.email,
      });
    }
    
    scope.setContext('session_info', {
      hasSession: !!session,
      sessionExpiry: session?.expires_at || 'unknown',
      refreshToken: !!session?.refresh_token,
      accessToken: !!session?.access_token
    });
    
    scope.setContext('browser_info', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    Sentry.captureException(error);
  });

  // Show critical notification to user
  toast({
    title: "🔐 Sesión Expirada",
    description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
    variant: "destructive",
  });

  // Optional: Redirect to login after a short delay
  setTimeout(() => {
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      console.info('🔄 Redirecting to login due to token refresh failure');
      window.location.href = '/login';
    }
  }, 3000);
}

/**
 * Handle general auth errors with logging
 */
function handleAuthError(error: any, event: AuthChangeEvent, session: Session | null) {
  console.error(`❌ Auth error during ${event}:`, error);
  
  Sentry.withScope((scope) => {
    scope.setTag('auth_event', event);
    scope.setLevel('warning');
    
    if (session?.user) {
      scope.setUser({
        id: session.user.id,
        email: session.user.email,
      });
    }
    
    scope.setContext('auth_error_context', {
      event,
      errorCode: error.code || 'unknown',
      errorMessage: error.message || 'Unknown auth error',
      hasSession: !!session
    });

    Sentry.captureException(new Error(`Auth error: ${error.message || 'Unknown auth error'}`));
  });
}

/**
 * Get current auth status for debugging
 */
export async function getAuthStatus() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  return {
    hasSession: !!session,
    isAuthenticated: !!session?.user,
    userId: session?.user?.id || null,
    email: session?.user?.email || null,
    sessionExpiry: session?.expires_at || null,
    error: error?.message || null,
    listenersInitialized: authListenersInitialized
  };
}