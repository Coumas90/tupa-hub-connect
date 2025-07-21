import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { refreshTokenManager } from '@/lib/auth/refresh-token-rotation';
import { useToastNotifications } from '@/hooks/use-toast-notifications';

export const useRefreshTokenRotation = () => {
  const toastNotifications = useToastNotifications();

  /**
   * Handle authentication state changes and register tokens
   */
  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    if (event === 'SIGNED_IN' && session?.refresh_token && session?.user?.id) {
      // Register the new refresh token
      const success = await refreshTokenManager.registerRefreshToken(
        session.refresh_token,
        session.user.id
      );
      
      if (!success) {
        console.warn('Failed to register refresh token for rotation');
      }
    }
  }, []);

  /**
   * Handle security breach notifications
   */
  const handleSecurityBreach = useCallback((event: CustomEvent) => {
    const { type, message } = event.detail;
    
    if (type === 'token_reuse') {
      toastNotifications.showError('Security Alert: ' + message);
    }
  }, [toastNotifications]);

  /**
   * Manually refresh session with token rotation
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.refresh_token) {
        return false;
      }

      const newSession = await refreshTokenManager.rotateRefreshToken(session.refresh_token);
      
      if (!newSession) {
        return false;
      }

      // Update Supabase session with new tokens
      await supabase.auth.setSession({
        access_token: newSession.access_token,
        refresh_token: newSession.refresh_token
      });

      return true;
    } catch (error) {
      console.error('Manual session refresh failed:', error);
      return false;
    }
  }, []);

  /**
   * Revoke all sessions (security action)
   */
  const revokeAllSessions = useCallback(async (): Promise<boolean> => {
    const success = await refreshTokenManager.revokeAllSessions();
    
    if (success) {
      toastNotifications.showSuccess('All sessions have been revoked successfully');
    } else {
      toastNotifications.showError('Failed to revoke sessions');
    }
    
    return success;
  }, [toastNotifications]);

  /**
   * Get active sessions
   */
  const getActiveSessions = useCallback(async () => {
    return await refreshTokenManager.getActiveSessions();
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Set up security breach listener
    window.addEventListener('security-breach', handleSecurityBreach as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('security-breach', handleSecurityBreach as EventListener);
    };
  }, [handleAuthStateChange, handleSecurityBreach]);

  return {
    refreshSession,
    revokeAllSessions,
    getActiveSessions
  };
};