import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/lib/security-logger';

interface DeviceInfo {
  user_agent?: string;
  ip_address?: string;
  device_id?: string;
}

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  user: any;
}

class RefreshTokenManager {
  private static instance: RefreshTokenManager;
  private refreshPromise: Promise<RefreshTokenResponse> | null = null;

  private constructor() {}

  static getInstance(): RefreshTokenManager {
    if (!RefreshTokenManager.instance) {
      RefreshTokenManager.instance = new RefreshTokenManager();
    }
    return RefreshTokenManager.instance;
  }

  /**
   * Get device information for session tracking
   */
  private getDeviceInfo(): DeviceInfo {
    const deviceId = this.getOrCreateDeviceId();
    
    return {
      user_agent: navigator.userAgent,
      device_id: deviceId
    };
  }

  /**
   * Get or create a persistent device ID
   */
  private getOrCreateDeviceId(): string {
    const existingId = localStorage.getItem('device_id');
    if (existingId) {
      return existingId;
    }

    const newId = crypto.randomUUID();
    localStorage.setItem('device_id', newId);
    return newId;
  }

  /**
   * Register a new refresh token with the rotation system
   */
  async registerRefreshToken(refreshToken: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('register-refresh-token', {
        body: {
          refresh_token: refreshToken,
          user_id: userId,
          device_info: this.getDeviceInfo()
        }
      });

      if (error) {
        console.error('Failed to register refresh token:', error);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error('Error registering refresh token:', error);
      return false;
    }
  }

  /**
   * Rotate refresh token with security checks
   */
  async rotateRefreshToken(refreshToken: string): Promise<RefreshTokenResponse | null> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRotation(refreshToken);
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token rotation
   */
  private async performTokenRotation(refreshToken: string): Promise<RefreshTokenResponse | null> {
    try {
      const { data, error } = await supabase.functions.invoke('refresh-token-rotation', {
        body: {
          refresh_token: refreshToken,
          device_info: this.getDeviceInfo()
        }
      });

      if (error) {
        console.error('Token rotation failed:', error);
        
        // Check if this is a token reuse detection
        if (error.code === 'TOKEN_REUSE_DETECTED') {
          this.handleTokenReuseDetected();
        }
        
        return null;
      }

      return data as RefreshTokenResponse;
    } catch (error) {
      console.error('Error during token rotation:', error);
      return null;
    }
  }

  /**
   * Handle token reuse detection (security breach)
   */
  private handleTokenReuseDetected(): void {
    console.warn('Token reuse detected! All sessions have been revoked for security.');
    
    // Clear local storage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('device_id');
    
    // Force logout
    supabase.auth.signOut();
    
    // Show security alert to user
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-breach', {
        detail: { 
          type: 'token_reuse',
          message: 'Security breach detected. You have been logged out for your protection.'
        }
      }));
    }
  }

  /**
   * Revoke all sessions for current user (manual security action)
   */
  async revokeAllSessions(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase.rpc('revoke_all_user_sessions', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Failed to revoke all sessions:', error);
        return false;
      }

      // Sign out current session
      await supabase.auth.signOut();
      
      return true;
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      return false;
    }
  }

  /**
   * Get active sessions for current user
   */
  async getActiveSessions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch active sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
  }
}

export const refreshTokenManager = RefreshTokenManager.getInstance();