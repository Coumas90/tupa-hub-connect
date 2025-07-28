import { supabase } from '@/integrations/supabase/client';
import { sentryUtils } from '@/lib/sentry';

export interface SecurityEvent {
  event_type: 'role_change' | 'admin_action' | 'login_failure' | 'suspicious_activity' | 'token_rotation';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Logs security events for monitoring and audit purposes
 */
export class SecurityLogger {
  private static instance: SecurityLogger;
  
  private constructor() {}
  
  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Log a security event
   */
  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      // Get client information
      const clientInfo = this.getClientInfo();
      
      const securityLog = {
        ...event,
        ip_address: event.ip_address || clientInfo.ip_address,
        user_agent: event.user_agent || clientInfo.user_agent,
        timestamp: new Date().toISOString(),
        session_id: this.getSessionId()
      };

      // For now, we'll log to console and Sentry
      // TODO: Create security_logs table in database for persistent logging

      // Log to Sentry for high/critical severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        sentryUtils.captureMessage(
          `Security Event: ${event.event_type}`,
          event.severity === 'critical' ? 'fatal' : 'warning',
          {
            securityEvent: securityLog
          }
        );
      }

      // Console log for development
      if (import.meta.env.DEV) {
        console.log(`🛡️ Security Event [${event.severity.toUpperCase()}]:`, securityLog);
      }

    } catch (error) {
      console.error('Failed to log security event:', error);
      // Still try to send to Sentry if local logging fails
      sentryUtils.captureError(error as Error, { 
        context: 'security-logging',
        originalEvent: event 
      });
    }
  }

  /**
   * Log admin role changes
   */
  async logRoleChange(targetUserId: string, role: string, action: 'granted' | 'revoked', adminUserId?: string): Promise<void> {
    await this.logEvent({
      event_type: 'role_change',
      user_id: adminUserId,
      details: {
        target_user_id: targetUserId,
        role,
        action
      },
      severity: role === 'admin' ? 'high' : 'medium'
    });
  }

  /**
   * Log admin actions
   */
  async logAdminAction(action: string, adminUserId: string, details: Record<string, any>): Promise<void> {
    await this.logEvent({
      event_type: 'admin_action',
      user_id: adminUserId,
      details: {
        action,
        ...details
      },
      severity: 'medium'
    });
  }

  /**
   * Log login failures
   */
  async logLoginFailure(email: string, reason: string): Promise<void> {
    await this.logEvent({
      event_type: 'login_failure',
      details: {
        email,
        reason
      },
      severity: 'medium'
    });
  }

  /**
   * Log suspicious activities
   */
  async logSuspiciousActivity(description: string, userId?: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent({
      event_type: 'suspicious_activity',
      user_id: userId,
      details: {
        description,
        ...details
      },
      severity: 'high'
    });
  }

  /**
   * Log token rotation events
   */
  async logTokenRotation(userId: string, success: boolean, reason?: string): Promise<void> {
    await this.logEvent({
      event_type: 'token_rotation',
      user_id: userId,
      details: {
        success,
        reason
      },
      severity: success ? 'low' : 'medium'
    });
  }

  /**
   * Get client information for logging
   */
  private getClientInfo(): { ip_address?: string; user_agent?: string } {
    return {
      user_agent: navigator.userAgent,
      // Note: IP address would need to be obtained from server-side
      ip_address: undefined
    };
  }

  /**
   * Get session ID for correlation
   */
  private getSessionId(): string {
    // Generate or retrieve session ID for correlation
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Helper functions for common security events
export const logSecurityEvent = {
  roleChange: (targetUserId: string, role: string, action: 'granted' | 'revoked', adminUserId?: string) =>
    securityLogger.logRoleChange(targetUserId, role, action, adminUserId),
    
  adminAction: (action: string, adminUserId: string, details: Record<string, any>) =>
    securityLogger.logAdminAction(action, adminUserId, details),
    
  loginFailure: (email: string, reason: string) =>
    securityLogger.logLoginFailure(email, reason),
    
  suspiciousActivity: (description: string, userId?: string, details?: Record<string, any>) =>
    securityLogger.logSuspiciousActivity(description, userId, details),
    
  tokenRotation: (userId: string, success: boolean, reason?: string) =>
    securityLogger.logTokenRotation(userId, success, reason)
};