import { supabase } from '@/integrations/supabase/client';
import { sentryUtils } from './sentry';

interface SecurityEvent {
  event_type: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private static instance: SecurityLogger;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async logEvent(event: SecurityEvent): Promise<void> {
    try {
      // Enrich event with client info
      const enrichedEvent = {
        ...event,
        user_agent: this.getClientInfo().user_agent,
        session_id: this.sessionId,
      };

      // Log to database
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: enrichedEvent.event_type,
        p_user_id: enrichedEvent.user_id || null,
        p_ip_address: enrichedEvent.ip_address || null,
        p_user_agent: enrichedEvent.user_agent || null,
        p_details: enrichedEvent.details || null,
        p_severity: enrichedEvent.severity,
        p_session_id: enrichedEvent.session_id,
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Log to Sentry for high/critical events
      if (event.severity === 'high' || event.severity === 'critical') {
        sentryUtils.captureMessage(
          `Security Event: ${event.event_type}`,
          event.severity === 'critical' ? 'error' : 'warning',
          {
            event_type: event.event_type,
            severity: event.severity,
            details: event.details,
            session_id: this.sessionId,
          }
        );
      }

      // Console log for development
      console.log(`[SECURITY] ${event.event_type}:`, {
        severity: event.severity,
        details: event.details,
        session_id: this.sessionId,
      });
    } catch (error) {
      console.error('Security logging failed:', error);
    }
  }

  async logRoleChange(
    targetUserId: string,
    role: string,
    action: 'granted' | 'revoked',
    adminUserId?: string
  ): Promise<void> {
    await this.logEvent({
      event_type: 'role_change',
      user_id: adminUserId,
      severity: 'high',
      details: {
        target_user_id: targetUserId,
        role,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logAdminAction(
    action: string,
    adminUserId: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      event_type: 'admin_action',
      user_id: adminUserId,
      severity: 'medium',
      details: {
        action,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logLoginFailure(email: string, reason: string): Promise<void> {
    await this.logEvent({
      event_type: 'login_failure',
      severity: 'medium',
      details: {
        email,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logSuspiciousActivity(
    description: string,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      event_type: 'suspicious_activity',
      user_id: userId,
      severity: 'high',
      details: {
        description,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async logTokenRotation(
    userId: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    await this.logEvent({
      event_type: 'token_rotation',
      user_id: userId,
      severity: success ? 'low' : 'medium',
      details: {
        success,
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getClientInfo(): { ip_address?: string; user_agent?: string } {
    return {
      user_agent: navigator.userAgent,
      // IP address will be captured server-side
    };
  }

  private getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const securityLogger = SecurityLogger.getInstance();

// Export convenience functions
export const logSecurityEvent = {
  roleChange: securityLogger.logRoleChange.bind(securityLogger),
  adminAction: securityLogger.logAdminAction.bind(securityLogger),
  loginFailure: securityLogger.logLoginFailure.bind(securityLogger),
  suspiciousActivity: securityLogger.logSuspiciousActivity.bind(securityLogger),
  tokenRotation: securityLogger.logTokenRotation.bind(securityLogger),
};