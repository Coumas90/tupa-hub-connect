import { useEffect, useCallback } from 'react';
import { securityLogger } from '@/lib/security-logger';
import { supabase } from '@/integrations/supabase/client';

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

  // Monitor session events
  const monitorSessionEvents = useCallback(() => {
    const handleSessionChange = (event: any) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // This is handled in the refresh token rotation hook
        return;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleSessionChange);
    return () => subscription.unsubscribe();
  }, []);

  // Set up all monitoring
  useEffect(() => {
    const cleanupAuth = monitorAuthFailures();
    const cleanupSuspicious = monitorSuspiciousActivity();
    const cleanupSession = monitorSessionEvents();

    return () => {
      cleanupAuth();
      cleanupSuspicious();
      cleanupSession();
    };
  }, [monitorAuthFailures, monitorSuspiciousActivity, monitorSessionEvents]);

  // Return utility functions for manual security logging
  return {
    logAdminAction: securityLogger.logAdminAction.bind(securityLogger),
    logSuspiciousActivity: securityLogger.logSuspiciousActivity.bind(securityLogger),
    logRoleChange: securityLogger.logRoleChange.bind(securityLogger),
  };
}