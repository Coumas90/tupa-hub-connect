/**
 * Production Security Guard
 * Prevents dangerous operations and configurations in production
 */

interface SecurityViolation {
  type: 'warning' | 'error' | 'critical';
  message: string;
  code: string;
  recommendation: string;
}

class ProductionGuard {
  private static instance: ProductionGuard;
  private violations: SecurityViolation[] = [];
  
  static getInstance(): ProductionGuard {
    if (!ProductionGuard.instance) {
      ProductionGuard.instance = new ProductionGuard();
    }
    return ProductionGuard.instance;
  }

  /**
   * Check if we're in production environment
   */
  get isProduction(): boolean {
    return import.meta.env.PROD || window.location.hostname !== 'localhost';
  }

  /**
   * Check if testing mode is enabled in production (CRITICAL)
   */
  validateTestingMode(): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    if (this.isProduction && (window as any).enableTestingMode) {
      violations.push({
        type: 'critical',
        code: 'TESTING_MODE_PROD',
        message: 'Testing mode utilities exposed in production environment',
        recommendation: 'Remove testing mode functions from production build'
      });
    }
    
    return violations;
  }

  /**
   * Validate CSP headers are properly configured
   */
  validateCSP(): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // Check if CSP header is present
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!meta && this.isProduction) {
      violations.push({
        type: 'error',
        code: 'MISSING_CSP',
        message: 'Content Security Policy header not detected',
        recommendation: 'Configure strict CSP headers in production'
      });
    }
    
    return violations;
  }

  /**
   * Validate sensitive data exposure
   */
  validateDataExposure(): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // Check for exposed secrets in window object
    const sensitiveKeys = ['SUPABASE_SERVICE_ROLE_KEY', 'API_SECRET', 'PRIVATE_KEY'];
    sensitiveKeys.forEach(key => {
      if ((window as any)[key] && this.isProduction) {
        violations.push({
          type: 'critical',
          code: 'EXPOSED_SECRET',
          message: `Sensitive data exposed in window.${key}`,
          recommendation: 'Remove sensitive data from client-side code'
        });
      }
    });
    
    return violations;
  }

  /**
   * Validate authentication configuration
   */
  validateAuthConfig(): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    
    // Check if proper session management is in place
    if (!localStorage.getItem('device_id') && this.isProduction) {
      violations.push({
        type: 'warning',
        code: 'NO_DEVICE_TRACKING',
        message: 'Device tracking not initialized',
        recommendation: 'Initialize device fingerprinting for session security'
      });
    }
    
    return violations;
  }

  /**
   * Run comprehensive security validation
   */
  performSecurityAudit(): SecurityViolation[] {
    this.violations = [];
    
    this.violations.push(...this.validateTestingMode());
    this.violations.push(...this.validateCSP());
    this.violations.push(...this.validateDataExposure());
    this.violations.push(...this.validateAuthConfig());
    
    // Log violations
    this.violations.forEach(violation => {
      const logMethod = violation.type === 'critical' ? 'error' : 
                       violation.type === 'error' ? 'warn' : 'info';
      console[logMethod](`[SECURITY ${violation.type.toUpperCase()}] ${violation.code}: ${violation.message}`);
    });
    
    return this.violations;
  }

  /**
   * Get current security score (0-100)
   */
  getSecurityScore(): number {
    const criticalCount = this.violations.filter(v => v.type === 'critical').length;
    const errorCount = this.violations.filter(v => v.type === 'error').length;
    const warningCount = this.violations.filter(v => v.type === 'warning').length;
    
    const totalPenalty = (criticalCount * 30) + (errorCount * 15) + (warningCount * 5);
    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Block dangerous operations in production
   */
  blockDangerousOperation(operation: string): boolean {
    if (!this.isProduction) return false;
    
    const dangerousOps = [
      'enableTestingMode',
      'bypassAuthentication', 
      'enableDebugMode',
      'exposeSecrets'
    ];
    
    if (dangerousOps.includes(operation)) {
      console.error(`[SECURITY BLOCK] Operation '${operation}' blocked in production`);
      return true;
    }
    
    return false;
  }

  /**
   * Start continuous monitoring in production
   */
  startProductionMonitoring(): void {
    if (!this.isProduction) return;
    
    // Audit on load
    this.performSecurityAudit();
    
    // Monitor for dangerous operations
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (args[0]?.includes?.('TESTING MODE ENABLED')) {
        this.violations.push({
          type: 'critical',
          code: 'TESTING_MODE_ACTIVATED',
          message: 'Testing mode was activated in production',
          recommendation: 'Immediately disable testing mode and investigate'
        });
      }
      originalConsoleWarn.apply(console, args);
    };
    
    // Periodic security checks
    setInterval(() => {
      const violations = this.performSecurityAudit();
      const criticalViolations = violations.filter(v => v.type === 'critical');
      
      if (criticalViolations.length > 0) {
        // Could integrate with monitoring service here
        console.error('[SECURITY ALERT] Critical security violations detected');
      }
    }, 300000); // Every 5 minutes
  }
}

export const productionGuard = ProductionGuard.getInstance();