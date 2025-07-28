import * as Sentry from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  tracesSampleRate: number;
  beforeSend?: (event: Sentry.Event, hint: Sentry.EventHint) => Sentry.Event | null;
}

/**
 * Initialize Sentry error tracking and performance monitoring
 */
export function initializeSentry(): void {
  // Get Sentry DSN from environment variables (configured in deployment)
  const sentryDsn = import.meta.env.PROD ? 
    'https://YOUR_SENTRY_DSN@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID' : 
    ''; // Replace with actual DSN in production deployment
  
  if (!sentryDsn || sentryDsn.includes('YOUR_SENTRY_DSN')) {
    console.log('⚠️ Sentry DSN not configured, error tracking disabled');
    return;
  }
  
  const config: SentryConfig = {
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Session Replay Configuration
    replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors will be recorded
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions will be traced
    
    // Filter sensitive data before sending to Sentry
    beforeSend: (event, hint) => {
      // Remove sensitive information from events
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
      }
      
      // Filter out localhost errors in development
      if (config.environment === 'development' && 
          event.request?.url?.includes('localhost')) {
        return null;
      }
      
      return event;
    }
  };

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    
    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
    
    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,
    
    // Configure integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask sensitive data in replays
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
    ],
    
    // Data filtering
    beforeSend: (event, hint) => {
      // Remove sensitive information from events
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.authorization;
      }
      
      // Filter out localhost errors in development
      if (config.environment === 'development' && 
          event.request?.url?.includes('localhost')) {
        return null;
      }
      
      return event;
    },
  });

  // Set user context for authenticated sessions
  setupUserContext();
  
  // Setup global error handlers
  setupGlobalErrorHandlers();
  
  console.log(`✅ Sentry initialized in ${config.environment} mode`);
}

/**
 * Setup user context for Sentry
 */
function setupUserContext(): void {
  // This will be called when user logs in
  const updateUserContext = (user: any) => {
    Sentry.setUser({
      id: user?.id,
      email: user?.email,
      username: user?.user_metadata?.name,
    });
  };

  // Listen for auth state changes
  if (typeof window !== 'undefined') {
    window.addEventListener('auth-state-change', (event: any) => {
      const { session } = event.detail;
      if (session?.user) {
        updateUserContext(session.user);
      } else {
        Sentry.setUser(null);
      }
    });
  }
}

/**
 * Setup additional global error handlers
 */
function setupGlobalErrorHandlers(): void {
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason, {
      tags: {
        errorType: 'unhandledRejection',
      },
      extra: {
        promise: event.promise,
        reason: event.reason,
      },
    });
  });

  // Capture global errors
  window.addEventListener('error', (event) => {
    Sentry.captureException(event.error || new Error(event.message), {
      tags: {
        errorType: 'globalError',
      },
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message,
      },
    });
  });

  // Capture resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      Sentry.captureMessage(`Resource loading error: ${(event.target as any)?.src || 'unknown'}`, 'warning');
    }
  }, true);
}

/**
 * Export a simple error boundary wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Utility functions for manual error tracking
 */
export const sentryUtils = {
  /**
   * Capture a custom error with context
   */
  captureError: (error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('customError', context);
      }
      Sentry.captureException(error);
    });
  },

  /**
   * Capture a custom message
   */
  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('customMessage', context);
      }
      Sentry.captureMessage(message, level);
    });
  },

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb: (message: string, category?: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message,
      category: category || 'custom',
      data,
      level: 'info',
    });
  },

  /**
   * Set user context
   */
  setUser: (user: { id?: string; email?: string; username?: string }) => {
    Sentry.setUser(user);
  },

  /**
   * Set custom tag
   */
  setTag: (key: string, value: string) => {
    Sentry.setTag(key, value);
  },

  /**
   * Performance monitoring
   */
  startTransaction: (name: string, operation: string) => {
    return Sentry.startSpan({ name, op: operation }, () => {});
  },
};

export default { initializeSentry, SentryErrorBoundary, sentryUtils };