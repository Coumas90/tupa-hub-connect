// Frontend client for secure secret access
// Uses Supabase Edge Functions for production-ready secret management

import { supabase } from '@/integrations/supabase/client';

interface SecretManagerResponse {
  success: boolean;
  cached: boolean;
  timestamp: string;
  error?: string;
}

class SecretsManager {
  private static instance: SecretsManager;
  private readonly functionName = 'secure-secrets-manager';

  private constructor() {}

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Securely validates that a secret exists and is accessible
   * Note: This doesn't return the actual secret value for security
   * 
   * @param secretName - Name of the secret to validate
   * @param cacheTtl - Cache TTL in seconds (default: 300)
   * @returns Promise<boolean> - Whether the secret is accessible
   */
  async validateSecret(secretName: string, cacheTtl: number = 300): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        body: {
          secret_name: secretName,
          cache_ttl: cacheTtl
        }
      });

      if (error) {
        console.warn('🔒 Secret validation failed:', error.message);
        return false;
      }

      const response: SecretManagerResponse = data;
      
      if (response.success) {
        console.log(`✅ Secret validated: ${secretName} (cached: ${response.cached})`);
        return true;
      } else {
        console.warn(`❌ Secret not accessible: ${secretName} - ${response.error}`);
        return false;
      }

    } catch (error) {
      console.error('💥 Secret validation error:', error);
      return false;
    }
  }

  /**
   * Validates multiple secrets in parallel
   * 
   * @param secretNames - Array of secret names to validate
   * @returns Promise<Record<string, boolean>> - Map of secret name to validity
   */
  async validateSecrets(secretNames: string[]): Promise<Record<string, boolean>> {
    const results = await Promise.allSettled(
      secretNames.map(name => this.validateSecret(name))
    );

    return secretNames.reduce((acc, name, index) => {
      const result = results[index];
      acc[name] = result.status === 'fulfilled' ? result.value : false;
      return acc;
    }, {} as Record<string, boolean>);
  }

  /**
   * Test connection to secrets manager
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use a known invalid secret to test the endpoint
      const { data, error } = await supabase.functions.invoke(this.functionName, {
        body: { secret_name: 'HEALTH_CHECK_INVALID' }
      });

      // Should return an error, but the endpoint should be reachable
      return !error || (data && typeof data.success === 'boolean');
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Production utilities
export const ProductionSecrets = {
  /**
   * Validate required secrets for production deployment
   */
  async validateProduction(): Promise<{
    ready: boolean;
    missing: string[];
    validated: string[];
  }> {
    const requiredSecrets = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'RESEND_API_KEY'
    ];

    const results = await secretsManager.validateSecrets(requiredSecrets);
    
    const validated = Object.entries(results)
      .filter(([, valid]) => valid)
      .map(([name]) => name);
    
    const missing = Object.entries(results)
      .filter(([, valid]) => !valid)
      .map(([name]) => name);

    return {
      ready: missing.length === 0,
      missing,
      validated
    };
  },

  /**
   * Monitor secrets health
   */
  async monitorSecrets(): Promise<void> {
    const health = await secretsManager.healthCheck();
    const production = await this.validateProduction();
    
    console.log('🔐 Secrets Health Check:', {
      endpoint: health ? '✅ Online' : '❌ Offline',
      production: production.ready ? '✅ Ready' : '⚠️ Missing secrets',
      missing: production.missing,
      timestamp: new Date().toISOString()
    });
  }
};