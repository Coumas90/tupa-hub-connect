import { jwtDecode } from 'jwt-decode';
import { supabase } from '@/integrations/supabase/client';
import * as Sentry from '@sentry/browser';
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
 * Refresh session function with timeout protection
 */
async function refreshSessionWithTimeout(): Promise<Session | null> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Session refresh timeout')), 10000);
  });

  const refreshPromise = supabase.auth.refreshSession().then(({ data, error }) => {
    if (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }
    return data.session;
  });

  return Promise.race([refreshPromise, timeoutPromise]);
}

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
    
    // Use timeout-protected refresh
    const refreshedSession = await refreshSessionWithTimeout();
    
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
        errorMessage
      }
    });
    
    console.error('❌ Critical error in session refresh:', errorMessage);
    
    return null;
  }
}

/**
 * Get auth guard stats for monitoring
 */
export function getAuthGuardStats() {
  return {
    refreshMethod: 'timeout-based',
    timeoutMs: 10000
  };
}