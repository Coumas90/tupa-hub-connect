import { useState, useEffect, useCallback } from 'react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { toast } from '@/hooks/use-toast';

interface SessionMonitorOptions {
  warningThresholdMinutes?: number;
  showToastWarning?: boolean;
  autoExtend?: boolean;
}

/**
 * Hook for monitoring session health and providing UX warnings
 * Provides proactive session management with user notifications
 */
export function useSessionMonitor(options: SessionMonitorOptions = {}) {
  const {
    warningThresholdMinutes = 5,
    showToastWarning = true,
    autoExtend = false
  } = options;

  const { getSessionTimeLeft, isSessionExpired, refreshUserData } = useOptimizedAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const sessionTimeLeft = getSessionTimeLeft();
  const warningThresholdMs = warningThresholdMinutes * 60 * 1000;

  useEffect(() => {
    const sessionExpired = isSessionExpired();
    
    if (sessionExpired) {
      setShowWarning(false);
      setHasShownWarning(false);
      return;
    }

    // Show warning when session is about to expire
    if (sessionTimeLeft <= warningThresholdMs && sessionTimeLeft > 0) {
      setShowWarning(true);
      
      // Show toast warning only once per session
      if (showToastWarning && !hasShownWarning) {
        const minutesLeft = Math.floor(sessionTimeLeft / 1000 / 60);
        
        toast({
          title: "Sesión por expirar",
          description: `Tu sesión expirará en ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}. ¿Deseas extenderla?`,
        });
        
        setHasShownWarning(true);
        
        // Auto-extend if enabled
        if (autoExtend) {
          extendSession();
        }
      }
    } else {
      setShowWarning(false);
    }
  }, [sessionTimeLeft, warningThresholdMs, isSessionExpired, showToastWarning, hasShownWarning, autoExtend]);

  const extendSession = useCallback(async () => {
    try {
      console.info('🔄 SessionMonitor: Extending session...');
      await refreshUserData();
      setShowWarning(false);
      setHasShownWarning(false);
      
      toast({
        title: "Sesión extendida",
        description: "Tu sesión ha sido renovada exitosamente",
      });
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast({
        title: "Error al extender sesión",
        description: "No se pudo renovar la sesión. Por favor, inicia sesión nuevamente.",
        variant: "destructive",
      });
    }
  }, [refreshUserData]);

  return {
    showWarning,
    timeLeftMinutes: Math.floor(sessionTimeLeft / 1000 / 60),
    timeLeftSeconds: Math.floor((sessionTimeLeft % (60 * 1000)) / 1000),
    extendSession,
    isExpired: isSessionExpired(),
    progress: Math.max(0, sessionTimeLeft / (60 * 60 * 1000)), // 0-1 for 1 hour session
  };
}