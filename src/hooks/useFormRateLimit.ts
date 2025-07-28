import { useState, useCallback, useRef } from 'react';
import { checkRateLimit } from '@/lib/middleware/spam-protection';

interface RateLimitOptions {
  debounceMs?: number;
  maxAttempts?: number;
  cooldownMs?: number;
}

interface RateLimitState {
  isSubmitting: boolean;
  attempts: number;
  lastAttempt: number;
  canSubmit: boolean;
  timeUntilReset: number;
}

/**
 * Hook for form submission rate limiting and debouncing
 * Prevents multiple simultaneous submissions and implements client-side rate limiting
 */
export function useFormRateLimit(options: RateLimitOptions = {}) {
  const {
    debounceMs = 500,
    maxAttempts = 3,
    cooldownMs = 5000
  } = options;

  const [state, setState] = useState<RateLimitState>({
    isSubmitting: false,
    attempts: 0,
    lastAttempt: 0,
    canSubmit: true,
    timeUntilReset: 0
  });

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const cooldownTimerRef = useRef<NodeJS.Timeout>();

  const resetCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      attempts: 0,
      canSubmit: true,
      timeUntilReset: 0
    }));
  }, []);

  const startCooldown = useCallback(() => {
    setState(prev => ({
      ...prev,
      canSubmit: false,
      timeUntilReset: cooldownMs
    }));

    // Clear existing timer
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    // Start cooldown timer
    cooldownTimerRef.current = setTimeout(resetCooldown, cooldownMs);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeUntilReset - 1000;
        if (newTime <= 0) {
          clearInterval(countdownInterval);
          return prev;
        }
        return { ...prev, timeUntilReset: newTime };
      });
    }, 1000);
  }, [cooldownMs, resetCooldown]);

  const checkClientRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastAttempt = now - state.lastAttempt;

    // Reset attempts if enough time has passed
    if (timeSinceLastAttempt > cooldownMs) {
      setState(prev => ({ ...prev, attempts: 0 }));
      return true;
    }

    // Check if we've exceeded max attempts
    if (state.attempts >= maxAttempts) {
      startCooldown();
      return false;
    }

    return true;
  }, [state.attempts, state.lastAttempt, maxAttempts, cooldownMs, startCooldown]);

  const attemptSubmission = useCallback(async <T>(
    submitFunction: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if already submitting
    if (state.isSubmitting) {
      return { success: false, error: 'Envío en progreso, espera un momento' };
    }

    // Check client-side rate limit
    if (!checkClientRateLimit()) {
      return { 
        success: false, 
        error: `Demasiados intentos. Espera ${Math.ceil(state.timeUntilReset / 1000)} segundos` 
      };
    }

    // Check server-side rate limit (using IP)
    try {
      const userIP = 'unknown'; // In a real app, get this from headers or context
      const rateLimitResult = checkRateLimit(userIP);
      
      if (!rateLimitResult.allowed) {
        return { 
          success: false, 
          error: rateLimitResult.reason === 'IP_BLOCKED' 
            ? 'IP bloqueada temporalmente por exceso de intentos'
            : `Límite de intentos excedido. Intentos restantes: ${rateLimitResult.remaining}`
        };
      }
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      // Continue anyway - don't block legitimate users due to rate limit failures
    }

    return new Promise((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        setState(prev => ({
          ...prev,
          isSubmitting: true,
          attempts: prev.attempts + 1,
          lastAttempt: Date.now()
        }));

        try {
          const result = await submitFunction();
          resolve({ success: true, data: result });
        } catch (error: any) {
          resolve({ 
            success: false, 
            error: error.message || 'Error en el envío' 
          });
        } finally {
          setState(prev => ({ ...prev, isSubmitting: false }));
        }
      }, debounceMs);
    });
  }, [state.isSubmitting, checkClientRateLimit, debounceMs, state.timeUntilReset]);

  // Cleanup timers on unmount
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
  }, []);

  return {
    isSubmitting: state.isSubmitting,
    canSubmit: state.canSubmit && !state.isSubmitting,
    attempts: state.attempts,
    timeUntilReset: state.timeUntilReset,
    attemptSubmission,
    cleanup
  };
}