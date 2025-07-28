import * as Sentry from '@sentry/react';

// Get Sentry DSN from environment or use empty string to disable
const sentryDsn = import.meta.env.VITE_SENTRY_DSN || '';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/.*\.supabase\.co\//, /^https:\/\/.*\.lovableproject\.com\//],
    // Session Replay
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Security-focused error filtering
    beforeSend(event, hint) {
      // Don't send events containing sensitive data
      if (event.message?.includes('password') || 
          event.message?.includes('token') ||
          event.message?.includes('secret')) {
        return null;
      }
      
      // Remove sensitive data from context
      if (event.extra) {
        delete event.extra.password;
        delete event.extra.token;
        delete event.extra.secret;
      }
      
      return event;
    }
  });
} else {
  console.warn('Sentry DSN not configured. Error tracking disabled.');
}

/**
 * Export a simple error boundary wrapper
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Utility functions for manual error tracking with tenant context
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
   * Set tenant context for multi-tenant monitoring
   */
  setTenantContext: (tenantInfo: {
    groupId?: string;
    groupName?: string;
    locationId?: string;
    locationName?: string;
    cafeId?: string;
    cafeName?: string;
  }) => {
    Sentry.withScope((scope) => {
      scope.setContext('tenant', {
        group_id: tenantInfo.groupId,
        group_name: tenantInfo.groupName,
        location_id: tenantInfo.locationId,
        location_name: tenantInfo.locationName,
        cafe_id: tenantInfo.cafeId,
        cafe_name: tenantInfo.cafeName,
        timestamp: new Date().toISOString(),
      });
      
      // Set tags for filtering in Sentry
      if (tenantInfo.groupId) scope.setTag('tenant.group_id', tenantInfo.groupId);
      if (tenantInfo.locationId) scope.setTag('tenant.location_id', tenantInfo.locationId);
      if (tenantInfo.cafeId) scope.setTag('tenant.cafe_id', tenantInfo.cafeId);
    });
  },

  /**
   * Log tenant switching events for performance monitoring
   */
  logTenantSwitch: (fromLocation?: string, toLocation?: string, switchTime?: number) => {
    Sentry.addBreadcrumb({
      message: 'Tenant location switched',
      category: 'tenant.switch',
      data: {
        from_location: fromLocation,
        to_location: toLocation,
        switch_time_ms: switchTime,
      },
      level: 'info',
    });
  },

  /**
   * Log cross-tenant contamination alerts
   */
  logContaminationAlert: (userId: string, expectedTenant: string, actualTenant: string, operation: string) => {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      scope.setContext('contamination', {
        user_id: userId,
        expected_tenant: expectedTenant,
        actual_tenant: actualTenant,
        operation,
        timestamp: new Date().toISOString(),
      });
      
      Sentry.captureMessage(
        `Cross-tenant contamination detected: User ${userId} accessed ${actualTenant} data while in ${expectedTenant} context`,
        'error'
      );
    });
  },

  /**
   * Performance monitoring with tenant context
   */
  startTransaction: (name: string, operation: string, tenantId?: string) => {
    return Sentry.startSpan({ 
      name, 
      op: operation,
      attributes: tenantId ? { 'tenant.id': tenantId } : {}
    }, () => {});
  },

  /**
   * Monitor cache performance
   */
  logCacheEvent: (event: 'hit' | 'miss' | 'set' | 'invalidate', key: string, tenantId?: string) => {
    Sentry.addBreadcrumb({
      message: `Cache ${event}`,
      category: 'cache',
      data: {
        cache_key: key,
        tenant_id: tenantId,
        timestamp: Date.now(),
      },
      level: 'info',
    });
  },
};

export default { SentryErrorBoundary, sentryUtils };