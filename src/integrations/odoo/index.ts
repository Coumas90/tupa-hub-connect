// Odoo Integration Module
// Provides comprehensive Odoo ERP integration for Tupa POS consumption data

export { OdooClient, type OdooConfig, type OdooAuthResponse, type OdooCreateResponse, type OdooSearchResponse } from './client';

export { OdooMapper, type OdooConsumptionRecord, type OdooConsumptionLine } from './mapper';

export { OdooSyncService, createOdooSyncService, syncConsumptionToOdoo, type OdooSyncConfig, type SyncResult, type SyncProgress } from './sync';

// Re-export common types
export type { ConsumptionRecord } from '../pos/consumption';

/**
 * Default Odoo configuration for common use cases
 */
export const DEFAULT_ODOO_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelayMs: 1000,
  batchSize: 50,
  enableDeduplication: true
};

/**
 * Odoo model names used by the integration
 */
export const ODOO_MODELS = {
  CONSUMPTION: 'tupa.consumption',
  CONSUMPTION_LINE: 'tupa.consumption.line',
  PARTNER: 'res.partner',
  CURRENCY: 'res.currency',
  COMPANY: 'res.company'
} as const;

/**
 * Consumption states in Odoo
 */
export const CONSUMPTION_STATES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  PROCESSED: 'processed'
} as const;

/**
 * Helper function to validate Odoo configuration
 */
export function validateOdooConfig(config: Partial<import('./client').OdooConfig>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.url) errors.push('Odoo URL is required');
  if (!config.database) errors.push('Database name is required');
  if (!config.username) errors.push('Username is required');
  if (!config.password) errors.push('Password is required');

  // URL validation
  if (config.url && !config.url.startsWith('http')) {
    errors.push('Odoo URL must start with http:// or https://');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to create a test connection
 */
export async function testOdooConnection(config: import('./client').OdooConfig): Promise<{ success: boolean; error?: string; serverInfo?: any }> {
  try {
    const client = new (await import('./client')).OdooClient(config);
    const isConnected = await client.validateConnection();
    
    if (!isConnected) {
      return { success: false, error: 'Unable to establish connection' };
    }

    const serverInfo = await client.getServerInfo();
    await client.logout();

    return { success: true, serverInfo };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown connection error'
    };
  }
}