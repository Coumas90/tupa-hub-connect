import { useEffect, useCallback } from 'react';
import { securityLogger } from '@/lib/security-logger';
import { supabase } from '@/integrations/supabase/client';
import { sentryUtils } from '@/lib/sentry';
import { tenantCache } from '@/lib/cache/tenant-cache';

export function useSecurityMonitor() {
  // Monitor failed authentication attempts
  const monitorAuthFailures = useCallback(() => {
    const handleAuthError = (event: CustomEvent) => {
      const { error, email } = event.detail;
      securityLogger.logLoginFailure(
        email || 'unknown',
        error?.message || 'Authentication failed'
      );
    };

    window.addEventListener('auth:error', handleAuthError as EventListener);
    return () => window.removeEventListener('auth:error', handleAuthError as EventListener);
  }, []);

  // Monitor suspicious activities
  const monitorSuspiciousActivity = useCallback(() => {
    let consecutiveFailures = 0;
    let lastFailureTime = 0;

    const handleSuspiciousActivity = () => {
      const now = Date.now();
      
      // Reset counter if more than 5 minutes since last failure
      if (now - lastFailureTime > 5 * 60 * 1000) {
        consecutiveFailures = 0;
      }

      consecutiveFailures++;
      lastFailureTime = now;

      // Log suspicious activity after 3 consecutive failures
      if (consecutiveFailures >= 3) {
        securityLogger.logSuspiciousActivity(
          'Multiple consecutive authentication failures',
          undefined,
          { 
            consecutive_failures: consecutiveFailures,
            timespan: '5min'
          }
        );
      }
    };

    window.addEventListener('auth:failure', handleSuspiciousActivity);
    return () => window.removeEventListener('auth:failure', handleSuspiciousActivity);
  }, []);

  // Monitor session events with tenant context
  const monitorSessionEvents = useCallback(() => {
    const handleSessionChange = (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        // Clear tenant cache on logout
        tenantCache.clear();
        sentryUtils.setUser({});
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Set user context for Sentry
        sentryUtils.setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleSessionChange);
    return () => subscription.unsubscribe();
  }, []);

  // Monitor tenant contamination
  const monitorTenantContamination = useCallback(() => {
    const interval = setInterval(() => {
      // Get current user
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          // Validate tenant cache integrity
          const isValid = tenantCache.validateTenantIntegrity(user.id);
          if (!isValid) {
            securityLogger.logSuspiciousActivity(
              'Tenant cache contamination detected',
              user.id,
              { 
                cache_stats: tenantCache.getStats(),
                user_id: user.id,
              }
            );
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Monitor performance metrics
  const monitorPerformance = useCallback(() => {
    const interval = setInterval(() => {
      const stats = tenantCache.getStats();
      
      // Log cache performance
      sentryUtils.addBreadcrumb(
        'Tenant cache performance',
        'performance',
        {
          hit_rate: stats.hitRate,
          cache_size: stats.cacheSize,
          total_operations: stats.hits + stats.misses + stats.sets,
        }
      );

      // Alert on poor cache performance
      if (stats.hitRate < 70 && (stats.hits + stats.misses) > 10) {
        sentryUtils.captureMessage(
          `Poor tenant cache performance: ${stats.hitRate}% hit rate`,
          'warning',
          { cache_stats: stats }
        );
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Set up all monitoring
  useEffect(() => {
    const cleanupAuth = monitorAuthFailures();
    const cleanupSuspicious = monitorSuspiciousActivity();
    const cleanupSession = monitorSessionEvents();
    const cleanupContamination = monitorTenantContamination();
    const cleanupPerformance = monitorPerformance();

    return () => {
      cleanupAuth();
      cleanupSuspicious();
      cleanupSession();
      cleanupContamination();
      cleanupPerformance();
    };
  }, [monitorAuthFailures, monitorSuspiciousActivity, monitorSessionEvents, monitorTenantContamination, monitorPerformance]);

  // Return utility functions for manual security logging
  return {
    logAdminAction: securityLogger.logAdminAction.bind(securityLogger),
    logSuspiciousActivity: securityLogger.logSuspiciousActivity.bind(securityLogger),
    logRoleChange: securityLogger.logRoleChange.bind(securityLogger),
    getTenantCacheStats: () => tenantCache.getStats(),
    validateTenantIntegrity: (userId: string) => tenantCache.validateTenantIntegrity(userId),
  };
}