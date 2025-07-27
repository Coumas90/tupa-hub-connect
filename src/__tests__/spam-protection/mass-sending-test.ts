import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit, getRateLimitStats } from '@/lib/middleware/spam-protection';

describe('Mass Sending Spam Protection Tests', () => {
  beforeEach(() => {
    // Limpiar estado antes de cada test
    Array.from({ length: 255 }, (_, i) => `192.168.1.${i}`)
      .forEach(ip => resetRateLimit(ip));
  });

  it('should handle simultaneous requests from 50 different IPs', async () => {
    const ips = Array.from({ length: 50 }, (_, i) => `192.168.1.${i + 1}`);
    const results: Array<{ ip: string; allowed: boolean; captchaRequired: boolean }> = [];

    // Simular envíos simultáneos desde 50 IPs diferentes
    for (const ip of ips) {
      for (let attempt = 1; attempt <= 6; attempt++) {
        const result = checkRateLimit(ip);
        results.push({
          ip,
          allowed: result.allowed,
          captchaRequired: result.captchaRequired
        });
      }
    }

    // Análisis de resultados
    const allowedRequests = results.filter(r => r.allowed).length;
    const captchaRequests = results.filter(r => r.captchaRequired).length;
    const blockedRequests = results.filter(r => !r.allowed).length;

    console.log('📊 Resultados del test de envío masivo:');
    console.log(`- Solicitudes permitidas: ${allowedRequests}`);
    console.log(`- Solicitudes con CAPTCHA: ${captchaRequests}`);
    console.log(`- Solicitudes bloqueadas: ${blockedRequests}`);
    console.log(`- Total de solicitudes: ${results.length}`);

    // Verificaciones
    expect(allowedRequests).toBeGreaterThan(0);
    expect(blockedRequests).toBeGreaterThan(0);
    expect(allowedRequests + blockedRequests).toBe(results.length);
    
    // Cada IP debería tener exactamente 5 solicitudes permitidas y 1 bloqueada
    for (const ip of ips) {
      const ipResults = results.filter(r => r.ip === ip);
      const ipAllowed = ipResults.filter(r => r.allowed).length;
      const ipBlocked = ipResults.filter(r => !r.allowed).length;
      
      expect(ipAllowed).toBe(5);
      expect(ipBlocked).toBe(1);
    }
  });

  it('should require CAPTCHA after 3 attempts per IP', () => {
    const testIP = '10.0.0.1';
    const results = [];

    // Realizar 6 intentos
    for (let i = 1; i <= 6; i++) {
      const result = checkRateLimit(testIP);
      results.push({ attempt: i, ...result });
    }

    // Verificar que CAPTCHA se requiere después del intento 3
    expect(results[0].captchaRequired).toBe(false); // Intento 1
    expect(results[1].captchaRequired).toBe(false); // Intento 2
    expect(results[2].captchaRequired).toBe(true);  // Intento 3
    expect(results[3].captchaRequired).toBe(true);  // Intento 4
    expect(results[4].captchaRequired).toBe(true);  // Intento 5
    expect(results[5].allowed).toBe(false);         // Intento 6 - bloqueado
  });

  it('should track rate limit statistics correctly', () => {
    const ips = ['10.0.0.1', '10.0.0.2', '10.0.0.3'];
    
    // IP 1: 3 intentos (requiere CAPTCHA)
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ips[0]);
    }
    
    // IP 2: 6 intentos (bloqueada)
    for (let i = 0; i < 6; i++) {
      checkRateLimit(ips[1]);
    }
    
    // IP 3: 2 intentos (normal)
    for (let i = 0; i < 2; i++) {
      checkRateLimit(ips[2]);
    }

    const stats = getRateLimitStats();
    
    expect(stats.totalIPs).toBe(3);
    expect(stats.captchaRequired).toBe(2); // IPs 1 y 2
    expect(stats.blockedIPs).toBe(1);      // Solo IP 2
  });

  it('should simulate coordinated attack from multiple subnets', () => {
    const subnets = [
      '192.168.1.',
      '192.168.2.',
      '10.0.0.',
      '172.16.0.',
      '203.0.113.'
    ];
    
    const attackResults = [];
    
    // Simular ataque coordinado: 10 IPs por subred, 6 intentos cada una
    for (const subnet of subnets) {
      for (let ipSuffix = 1; ipSuffix <= 10; ipSuffix++) {
        const ip = `${subnet}${ipSuffix}`;
        
        for (let attempt = 1; attempt <= 6; attempt++) {
          const result = checkRateLimit(ip);
          attackResults.push({
            ip,
            subnet,
            attempt,
            allowed: result.allowed,
            reason: result.reason
          });
        }
      }
    }

    // Análisis del ataque
    const totalAttempts = attackResults.length;
    const blockedAttempts = attackResults.filter(r => !r.allowed).length;
    const blockingEfficiency = (blockedAttempts / totalAttempts) * 100;

    console.log('🛡️  Resultados del test de ataque coordinado:');
    console.log(`- Total de intentos: ${totalAttempts}`);
    console.log(`- Intentos bloqueados: ${blockedAttempts}`);
    console.log(`- Eficiencia de bloqueo: ${blockingEfficiency.toFixed(1)}%`);

    // Verificar que el sistema bloquea efectivamente los ataques
    expect(blockingEfficiency).toBeGreaterThan(15); // Al menos 15% bloqueado
    expect(blockedAttempts).toBeGreaterThan(0);
    
    // Verificar que cada IP fue bloqueada después de 5 intentos
    const uniqueIPs = [...new Set(attackResults.map(r => r.ip))];
    for (const ip of uniqueIPs) {
      const ipAttempts = attackResults.filter(r => r.ip === ip);
      const lastAttempt = ipAttempts[ipAttempts.length - 1];
      expect(lastAttempt.allowed).toBe(false);
    }
  });

  it('should reset rate limits correctly', () => {
    const testIP = '192.168.100.1';
    
    // Generar intentos hasta ser bloqueado
    for (let i = 0; i < 6; i++) {
      checkRateLimit(testIP);
    }
    
    // Verificar que está bloqueado
    let result = checkRateLimit(testIP);
    expect(result.allowed).toBe(false);
    
    // Resetear y verificar que funciona de nuevo
    resetRateLimit(testIP);
    result = checkRateLimit(testIP);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // Primera solicitud después del reset
  });

  it('should handle burst traffic patterns', () => {
    const burstIP = '203.0.113.100';
    const burstResults = [];
    
    // Simular tráfico en ráfagas: 3 intentos rápidos, pausa, 3 más
    for (let burst = 1; burst <= 2; burst++) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const result = checkRateLimit(burstIP);
        burstResults.push({
          burst,
          attempt,
          totalAttempt: (burst - 1) * 3 + attempt,
          ...result
        });
      }
    }
    
    // Primera ráfaga: 3 intentos, tercero requiere CAPTCHA
    expect(burstResults[0].captchaRequired).toBe(false);
    expect(burstResults[1].captchaRequired).toBe(false);
    expect(burstResults[2].captchaRequired).toBe(true);
    
    // Segunda ráfaga: todos requieren CAPTCHA
    expect(burstResults[3].captchaRequired).toBe(true);
    expect(burstResults[4].captchaRequired).toBe(true);
    expect(burstResults[5].allowed).toBe(false); // Sexto intento bloqueado
  });
});