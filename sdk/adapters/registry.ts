/**
 * Multi-provider adapter registry for POS integrations
 */
import { TupaHubClient } from '../tupahub.client';
import { createLogger } from '../utils/logger';

export interface POSAdapter {
  /** Adapter name/identifier */
  name: string;
  /** Provider version */
  version: string;
  /** Sync sales from POS to TUPÁ Hub */
  syncSales(client: TupaHubClient): Promise<SyncResult>;
  /** Sync products from TUPÁ Hub to POS */
  syncProducts?(client: TupaHubClient): Promise<SyncResult>;
  /** Sync clients from POS to TUPÁ Hub */
  syncClients?(client: TupaHubClient): Promise<SyncResult>;
  /** Health check for POS connection */
  healthCheck(): Promise<boolean>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  timestamp: string;
  details?: Record<string, any>;
}

export interface AdapterConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

/**
 * Registry for managing multiple POS adapters
 */
export class AdapterRegistry {
  private adapters = new Map<string, POSAdapter>();
  private logger = createLogger('AdapterRegistry');

  /**
   * Register a new POS adapter
   */
  register(adapter: POSAdapter): void {
    this.logger.info(`Registering adapter: ${adapter.name} v${adapter.version}`);
    this.adapters.set(adapter.name.toLowerCase(), adapter);
  }

  /**
   * Get adapter by name
   */
  getAdapter(name: string): POSAdapter | undefined {
    return this.adapters.get(name.toLowerCase());
  }

  /**
   * List all registered adapters
   */
  listAdapters(): Array<{name: string; version: string}> {
    return Array.from(this.adapters.values()).map(adapter => ({
      name: adapter.name,
      version: adapter.version
    }));
  }

  /**
   * Sync all adapters with TUPÁ Hub
   */
  async syncAll(client: TupaHubClient): Promise<Record<string, SyncResult>> {
    const results: Record<string, SyncResult> = {};
    
    this.logger.info(`Starting sync for ${this.adapters.size} adapters`);

    for (const [name, adapter] of this.adapters) {
      try {
        this.logger.info(`Syncing adapter: ${name}`);
        results[name] = await adapter.syncSales(client);
        this.logger.info(`Sync completed for ${name}`, { 
          success: results[name].success,
          records: results[name].recordsProcessed 
        });
      } catch (error) {
        this.logger.error(`Sync failed for ${name}`, { error });
        results[name] = {
          success: false,
          recordsProcessed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          timestamp: new Date().toISOString()
        };
      }
    }

    return results;
  }

  /**
   * Health check for all adapters
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, adapter] of this.adapters) {
      try {
        results[name] = await adapter.healthCheck();
      } catch (error) {
        this.logger.warn(`Health check failed for ${name}`, { error });
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Remove adapter from registry
   */
  unregister(name: string): boolean {
    return this.adapters.delete(name.toLowerCase());
  }

  /**
   * Clear all adapters
   */
  clear(): void {
    this.adapters.clear();
    this.logger.info('All adapters cleared from registry');
  }
}

// Global adapter registry instance
export const adapterRegistry = new AdapterRegistry();

// Auto-register available adapters
import { FudoAdapter } from './fudo.adapter';

// Register Fudo adapter with default config (can be overridden)
export const registerDefaultAdapters = (configs: Record<string, AdapterConfig>) => {
  if (configs.fudo) {
    const fudoAdapter = new FudoAdapter(configs.fudo);
    adapterRegistry.register(fudoAdapter);
  }
  
  // Add more default adapters as they become available
  // if (configs.bistrosoft) {
  //   const bistrSoftAdapter = new BistrSoftAdapter(configs.bistrosoft);
  //   adapterRegistry.register(bistrSoftAdapter);
  // }
};

/**
 * Utility function to create and sync a specific adapter
 */
export async function quickSync(
  adapterName: string, 
  config: AdapterConfig, 
  client: TupaHubClient
): Promise<SyncResult> {
  const adapter = adapterRegistry.getAdapter(adapterName);
  
  if (!adapter) {
    throw new Error(`Adapter '${adapterName}' not found in registry`);
  }

  return adapter.syncSales(client);
}