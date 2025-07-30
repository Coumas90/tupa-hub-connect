import { useState, useEffect, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SessionHealth {
  isHealthy: boolean;
  expiresIn: number;
  refreshedAt: number | null;
  warningThreshold: number;
  needsRefresh: boolean;
}

export function useSessionMonitor() {
  const [sessionHealth, setSessionHealth] = useState<SessionHealth>({
    isHealthy: false,
    expiresIn: 0,
    refreshedAt: null,
    warningThreshold: 5 * 60 * 1000, // 5 minutes
    needsRefresh: false
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const lastRefreshRef = useRef<number>(0);

  const checkSessionHealth = useCallback((session: Session | null) => {
    if (!session) {
      setSessionHealth(prev => ({
        ...prev,
        isHealthy: false,
        expiresIn: 0,
        needsRefresh: false
      }));
      return;
    }

    const now = Date.now();
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const expiresIn = expiresAt - now;
    const warningThreshold = 5 * 60 * 1000; // 5 minutes

    setSessionHealth(prev => ({
      ...prev,
      isHealthy: expiresIn > 0,
      expiresIn,
      needsRefresh: expiresIn < warningThreshold && expiresIn > 0,
      warningThreshold
    }));
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const now = Date.now();
      
      // Prevent too frequent refreshes
      if (now - lastRefreshRef.current < 30000) { // 30 seconds
        return false;
      }

      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }

      lastRefreshRef.current = now;
      setSessionHealth(prev => ({
        ...prev,
        refreshedAt: now,
        needsRefresh: false
      }));

      return true;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }, []);

  const startMonitoring = useCallback((session: Session | null) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!session) return;

    // Check immediately
    checkSessionHealth(session);

    // Check every minute
    intervalRef.current = setInterval(() => {
      checkSessionHealth(session);
    }, 60000);
  }, [checkSessionHealth]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => stopMonitoring();
  }, [stopMonitoring]);

  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }, []);

  return {
    sessionHealth,
    refreshSession,
    startMonitoring,
    stopMonitoring,
    formatTimeRemaining
  };
}