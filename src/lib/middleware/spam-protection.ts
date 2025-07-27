import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  captchaRequired: boolean;
  blocked: boolean;
}

// En producción esto debería ser Redis o base de datos
const rateLimitStore = new Map<string, RateLimitEntry>();
const HOUR_IN_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const CAPTCHA_THRESHOLD = 3;

export interface SpamCheckResult {
  allowed: boolean;
  captchaRequired: boolean;
  remaining: number;
  resetTime: number;
  reason?: string;
}

export function checkRateLimit(ip: string): SpamCheckResult {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Limpiar entradas expiradas
  if (entry && (now - entry.firstAttempt) > HOUR_IN_MS) {
    rateLimitStore.delete(ip);
  }

  const currentEntry = rateLimitStore.get(ip) || {
    count: 0,
    firstAttempt: now,
    lastAttempt: now,
    captchaRequired: false,
    blocked: false
  };

  // Verificar si está bloqueado
  if (currentEntry.blocked) {
    logger.warn('Blocked IP attempted access', { ip, attempts: currentEntry.count });
    return {
      allowed: false,
      captchaRequired: true,
      remaining: 0,
      resetTime: currentEntry.firstAttempt + HOUR_IN_MS,
      reason: 'IP_BLOCKED'
    };
  }

  // Incrementar contador
  currentEntry.count++;
  currentEntry.lastAttempt = now;

  // Determinar si requiere CAPTCHA
  if (currentEntry.count >= CAPTCHA_THRESHOLD) {
    currentEntry.captchaRequired = true;
  }

  // Determinar si debe ser bloqueado
  if (currentEntry.count > MAX_REQUESTS_PER_HOUR) {
    currentEntry.blocked = true;
    logger.error('IP blocked for exceeding rate limit', { 
      ip, 
      attempts: currentEntry.count,
      timeWindow: now - currentEntry.firstAttempt 
    });
    
    return {
      allowed: false,
      captchaRequired: true,
      remaining: 0,
      resetTime: currentEntry.firstAttempt + HOUR_IN_MS,
      reason: 'RATE_LIMIT_EXCEEDED'
    };
  }

  rateLimitStore.set(ip, currentEntry);

  return {
    allowed: true,
    captchaRequired: currentEntry.captchaRequired,
    remaining: MAX_REQUESTS_PER_HOUR - currentEntry.count,
    resetTime: currentEntry.firstAttempt + HOUR_IN_MS
  };
}

export function validateCaptcha(token: string): boolean {
  // Simulación de validación de CAPTCHA
  // En producción integrar con reCAPTCHA, hCaptcha, etc.
  return token === 'valid_captcha_token' || token.startsWith('mock_');
}

export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
  logger.info('Rate limit reset for IP', { ip });
}

export function getRateLimitStats(): { totalIPs: number, blockedIPs: number, captchaRequired: number } {
  const stats = {
    totalIPs: rateLimitStore.size,
    blockedIPs: 0,
    captchaRequired: 0
  };

  rateLimitStore.forEach(entry => {
    if (entry.blocked) stats.blockedIPs++;
    if (entry.captchaRequired) stats.captchaRequired++;
  });

  return stats;
}

export function cleanupExpiredEntries(): void {
  const now = Date.now();
  const expired: string[] = [];

  rateLimitStore.forEach((entry, ip) => {
    if ((now - entry.firstAttempt) > HOUR_IN_MS) {
      expired.push(ip);
    }
  });

  expired.forEach(ip => {
    rateLimitStore.delete(ip);
  });

  if (expired.length > 0) {
    logger.info('Cleaned up expired rate limit entries', { count: expired.length });
  }
}