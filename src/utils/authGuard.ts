import { jwtDecode } from 'jwt-decode';
import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/browser';
import CircuitBreaker from 'opossum';
import type { Session } from '@supabase/supabase-js';

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
}

/**
 * Checks if a JWT token is expired with a 30-second safety margin
 * @param token - The JWT token to check
 * @returns true if the token is expired or will expire within 30 seconds
 */
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Math.floor(Date.now() / 1000);
    const safetyMargin = 30; // 30 seconds
    
    return decoded.exp <= (currentTime + safetyMargin);
  } catch (error) {
    // If we can't decode the token, consider it expired
    console.warn('Failed to decode JWT token:', error);
    return true;
  }
}

/**
 * Refresh session function with error handling
 */
async function refreshSessionInternal(): Promise<Session | null> {
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    throw new Error(`Session refresh failed: ${error.message}`);
  }
  
  return data.session;
}

// Circuit breaker configuration
const circuitBreakerOptions = {
  timeout: 10000, // 10 seconds timeout
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  rollingCountTimeout: 60000, // 1 minute rolling window
  rollingCountBuckets: 10, // Number of buckets in the rolling window
  name: 'sessionRefresh',
  group: 'auth'
};

// Create circuit breaker for session refresh
const refreshCircuitBreaker = new CircuitBreaker(refreshSessionInternal, circuitBreakerOptions);

// Circuit breaker event handlers
refreshCircuitBreaker.on('open', () => {
  console.warn('🔥 Session refresh circuit breaker opened - too many failures');
  Sentry.captureMessage('Session refresh circuit breaker opened', 'warning');
});

refreshCircuitBreaker.on('halfOpen', () => {
  console.info('🔄 Session refresh circuit breaker half-open - testing...');
});

refreshCircuitBreaker.on('close', () => {
  console.info('✅ Session refresh circuit breaker closed - service recovered');
});

/**
 * Checks current session and refreshes if needed with circuit breaker protection
 * @returns Promise<Session | null> - The current or refreshed session, null if failed
 */
export async function checkAndRefreshSession(): Promise<Session | null> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('Failed to get current session:', sessionError);
      return null;
    }
    
    if (!session?.access_token) {
      console.info('No active session found');
      return null;
    }
    
    // Check if token is expired
    if (!isTokenExpired(session.access_token)) {
      // Token is still valid
      return session;
    }
    
    console.info('🔄 Access token expired, attempting refresh...');
    
    // Use circuit breaker for refresh
    const refreshedSession = await refreshCircuitBreaker.fire();
    
    if (refreshedSession) {
      console.info('✅ Session refreshed successfully');
      return refreshedSession;
    }
    
    console.warn('⚠️ Session refresh returned null');
    return null;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Capture critical errors with Sentry
    Sentry.captureException(error, {
      tags: {
        component: 'authGuard',
        operation: 'checkAndRefreshSession'
      },
      extra: {
        circuitBreakerState: refreshCircuitBreaker.stats,
        errorMessage
      }
    });
    
    console.error('❌ Critical error in session refresh:', errorMessage);
    
    // If circuit breaker is open, return null gracefully
    if (refreshCircuitBreaker.opened) {
      console.warn('🚫 Circuit breaker is open, skipping refresh attempt');
      return null;
    }
    
    return null;
  }
}

/**
 * Get circuit breaker stats for monitoring
 */
export function getAuthGuardStats() {
  return {
    circuitBreakerStats: refreshCircuitBreaker.stats,
    isCircuitBreakerOpen: refreshCircuitBreaker.opened,
    isCircuitBreakerHalfOpen: refreshCircuitBreaker.halfOpen
  };
}