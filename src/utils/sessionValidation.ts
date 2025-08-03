import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getUserRole, RoleCheckResult } from './authRoleUtils';

export interface SessionValidationResult {
  isValid: boolean;
  user: User | null;
  session: Session | null;
  roleResult: RoleCheckResult | null;
  reason?: 'expired' | 'invalid' | 'missing' | 'refresh_failed';
}

export interface SessionLogEntry {
  timestamp: string;
  userId: string | null;
  sessionId: string | null;
  action: 'login' | 'logout' | 'refresh' | 'validation' | 'redirect';
  success: boolean;
  role?: string | null;
  route?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

// In-memory session log (in production, this should go to a database)
let sessionLogs: SessionLogEntry[] = [];

/**
 * Validate current session and refresh if needed
 */
export async function validateCurrentSession(): Promise<SessionValidationResult> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logSessionEvent({
        action: 'validation',
        success: false,
        details: { error: error.message }
      });
      
      return {
        isValid: false,
        user: null,
        session: null,
        roleResult: null,
        reason: 'invalid'
      };
    }

    if (!session || !session.user) {
      logSessionEvent({
        action: 'validation',
        success: false,
        details: { reason: 'no_session' }
      });
      
      return {
        isValid: false,
        user: null,
        session: null,
        roleResult: null,
        reason: 'missing'
      };
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    
    if (expiresAt <= now) {
      logSessionEvent({
        userId: session.user.id,
        sessionId: session.access_token?.substring(0, 8),
        action: 'validation',
        success: false,
        details: { reason: 'expired', expiresAt, now }
      });

      return {
        isValid: false,
        user: session.user,
        session,
        roleResult: null,
        reason: 'expired'
      };
    }

    // Get user role information
    const roleResult = await getUserRole(session.user);
    
    logSessionEvent({
      userId: session.user.id,
      sessionId: session.access_token?.substring(0, 8),
      action: 'validation',
      success: true,
      role: roleResult.role,
      details: { 
        roleSource: roleResult.source,
        expiresIn: expiresAt - now 
      }
    });

    return {
      isValid: true,
      user: session.user,
      session,
      roleResult
    };

  } catch (error) {
    console.error('Session validation error:', error);
    
    logSessionEvent({
      action: 'validation',
      success: false,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    return {
      isValid: false,
      user: null,
      session: null,
      roleResult: null,
      reason: 'invalid'
    };
  }
}

/**
 * Refresh session if needed
 */
export async function refreshSessionIfNeeded(session: Session): Promise<SessionValidationResult> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || 0;
  const timeToExpiry = expiresAt - now;

  // Refresh if expires in less than 5 minutes
  if (timeToExpiry < 300) {
    try {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
      
      if (error) {
        logSessionEvent({
          userId: session.user.id,
          sessionId: session.access_token?.substring(0, 8),
          action: 'refresh',
          success: false,
          details: { error: error.message }
        });

        return {
          isValid: false,
          user: session.user,
          session,
          roleResult: null,
          reason: 'refresh_failed'
        };
      }

      const newSession = data.session;
      if (newSession) {
        const roleResult = await getUserRole(newSession.user);
        
        logSessionEvent({
          userId: newSession.user.id,
          sessionId: newSession.access_token?.substring(0, 8),
          action: 'refresh',
          success: true,
          role: roleResult.role
        });

        return {
          isValid: true,
          user: newSession.user,
          session: newSession,
          roleResult
        };
      }
    } catch (error) {
      logSessionEvent({
        userId: session.user.id,
        action: 'refresh',
        success: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Session doesn't need refresh
  const roleResult = await getUserRole(session.user);
  return {
    isValid: true,
    user: session.user,
    session,
    roleResult
  };
}

/**
 * Log session events for debugging and security
 */
export function logSessionEvent(entry: Partial<SessionLogEntry>) {
  const fullEntry: SessionLogEntry = {
    timestamp: new Date().toISOString(),
    userId: entry.userId || null,
    sessionId: entry.sessionId || null,
    action: entry.action || 'validation',
    success: entry.success ?? false,
    role: entry.role,
    route: entry.route || window.location.pathname,
    ip: entry.ip,
    userAgent: entry.userAgent || navigator.userAgent,
    details: entry.details || {}
  };

  sessionLogs.push(fullEntry);

  // Keep only last 100 entries in memory
  if (sessionLogs.length > 100) {
    sessionLogs = sessionLogs.slice(-100);
  }

  // Console log for debugging
  console.log('🔐 Session Event:', {
    action: fullEntry.action,
    success: fullEntry.success,
    userId: fullEntry.userId?.substring(0, 8),
    role: fullEntry.role,
    route: fullEntry.route
  });
}

/**
 * Get session logs for debugging
 */
export function getSessionLogs(): SessionLogEntry[] {
  return [...sessionLogs];
}

/**
 * Clear session logs
 */
export function clearSessionLogs() {
  sessionLogs = [];
}
