import { useState, useCallback, useRef, useEffect } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  progressiveBackoff?: boolean;
}

interface RateLimitState {
  attempts: number;
  isBlocked: boolean;
  blockedUntil: number | null;
  canSubmit: boolean;
  timeRemaining: number;
  nextAttemptIn: number;
}

interface RateLimitActions {
  recordAttempt: () => void;
  recordSuccess: () => void;
  reset: () => void;
  forceUnblock: () => void;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  blockDurationMs: 5 * 60 * 1000, // 5 minutes
  progressiveBackoff: true,
};

export function useAdvancedRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitState & RateLimitActions {
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const storageKey = `rate_limit_${identifier}`;
  
  const [state, setState] = useState<RateLimitState>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Check if block has expired
        if (parsed.blockedUntil && now >= parsed.blockedUntil) {
          return {
            attempts: 0,
            isBlocked: false,
            blockedUntil: null,
            canSubmit: true,
            timeRemaining: 0,
            nextAttemptIn: 0,
          };
        }
        
        return {
          attempts: parsed.attempts || 0,
          isBlocked: parsed.isBlocked || false,
          blockedUntil: parsed.blockedUntil || null,
          canSubmit: !parsed.isBlocked,
          timeRemaining: parsed.blockedUntil ? Math.max(0, parsed.blockedUntil - now) : 0,
          nextAttemptIn: parsed.blockedUntil ? Math.max(0, parsed.blockedUntil - now) : 0,
        };
      } catch {
        // Invalid stored data, reset
      }
    }
    
    return {
      attempts: 0,
      isBlocked: false,
      blockedUntil: null,
      canSubmit: true,
      timeRemaining: 0,
      nextAttemptIn: 0,
    };
  });

  const timerRef = useRef<NodeJS.Timeout>();

  // Save state to localStorage
  const saveState = useCallback((newState: RateLimitState) => {
    localStorage.setItem(storageKey, JSON.stringify({
      attempts: newState.attempts,
      isBlocked: newState.isBlocked,
      blockedUntil: newState.blockedUntil,
    }));
  }, [storageKey]);

  // Update timer
  const updateTimer = useCallback(() => {
    if (state.blockedUntil) {
      const now = Date.now();
      const timeRemaining = Math.max(0, state.blockedUntil - now);
      
      if (timeRemaining > 0) {
        setState(prev => ({
          ...prev,
          timeRemaining,
          nextAttemptIn: timeRemaining,
        }));
      } else {
        // Block expired, reset
        setState(prev => ({
          ...prev,
          attempts: 0,
          isBlocked: false,
          blockedUntil: null,
          canSubmit: true,
          timeRemaining: 0,
          nextAttemptIn: 0,
        }));
      }
    }
  }, [state.blockedUntil]);

  // Start timer when blocked
  useEffect(() => {
    if (state.isBlocked && state.blockedUntil) {
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [state.isBlocked, state.blockedUntil, updateTimer]);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const newAttempts = state.attempts + 1;
    
    console.info('🔄 RateLimit: Recording attempt', { 
      identifier, 
      attempts: newAttempts, 
      maxAttempts: finalConfig.maxAttempts 
    });

    if (newAttempts >= finalConfig.maxAttempts) {
      // Calculate block duration with progressive backoff
      let blockDuration = finalConfig.blockDurationMs;
      
      if (finalConfig.progressiveBackoff) {
        const blockMultiplier = Math.min(Math.floor(newAttempts / finalConfig.maxAttempts), 5);
        blockDuration *= Math.pow(2, blockMultiplier);
      }
      
      const blockedUntil = now + blockDuration;
      
      console.warn('🚫 RateLimit: User blocked', {
        identifier,
        attempts: newAttempts,
        blockDuration: blockDuration / 1000 / 60,
        blockedUntil: new Date(blockedUntil).toISOString(),
      });

      const newState = {
        attempts: newAttempts,
        isBlocked: true,
        blockedUntil,
        canSubmit: false,
        timeRemaining: blockDuration,
        nextAttemptIn: blockDuration,
      };
      
      setState(newState);
      saveState(newState);
    } else {
      const newState = {
        ...state,
        attempts: newAttempts,
        canSubmit: true,
      };
      
      setState(newState);
      saveState(newState);
    }
  }, [state, finalConfig, identifier, saveState]);

  const recordSuccess = useCallback(() => {
    console.info('✅ RateLimit: Success recorded, resetting attempts', { identifier });
    
    const newState = {
      attempts: 0,
      isBlocked: false,
      blockedUntil: null,
      canSubmit: true,
      timeRemaining: 0,
      nextAttemptIn: 0,
    };
    
    setState(newState);
    saveState(newState);
  }, [identifier, saveState]);

  const reset = useCallback(() => {
    console.info('🔄 RateLimit: Manual reset', { identifier });
    
    const newState = {
      attempts: 0,
      isBlocked: false,
      blockedUntil: null,
      canSubmit: true,
      timeRemaining: 0,
      nextAttemptIn: 0,
    };
    
    setState(newState);
    localStorage.removeItem(storageKey);
  }, [identifier, storageKey]);

  const forceUnblock = useCallback(() => {
    console.warn('⚠️ RateLimit: Force unblock', { identifier });
    reset();
  }, [identifier, reset]);

  return {
    ...state,
    recordAttempt,
    recordSuccess,
    reset,
    forceUnblock,
  };
}