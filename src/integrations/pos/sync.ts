import { getPOSAdapter, posRegistry, POSAdapter } from './registry';
import { TupaSalesData } from './fudo/types';

// Sync interfaces
export interface SyncConfig {
  clientId: string;
  posType: string;
  posConfig: any;
  dateRange?: { from: string; to: string };
  batchSize?: number;
  simulationMode?: boolean;
}

export interface SyncResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  timestamp: string;
  errors?: string[];
  metadata?: {
    duration: number;
    posProvider: string;
    syncType: 'manual' | 'scheduled' | 'real-time';
    batchCount?: number;
  };
}

export interface SyncProgress {
  clientId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  startTime: string;
  estimatedCompletion?: string;
}

/**
 * Base POS Sync Service
 * Provides core synchronization functionality for all POS integrations
 */
export class POSSyncService {
  private adapter: POSAdapter;
  private config: SyncConfig;

  constructor(config: SyncConfig) {
    this.config = config;
    this.adapter = getPOSAdapter(config.posType, config.posConfig);
  }

  /**
   * Performs a full sync operation
   */
  async sync(): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[POS Sync] Starting sync for client ${this.config.clientId} with ${this.config.posType}`);
      
      // Validate connection first
      const isConnected = await this.adapter.validateConnection();
      if (!isConnected) {
        throw new Error(`Unable to connect to ${this.config.posType} POS system`);
      }

      // Determine date range
      const dateRange = this.config.dateRange || await this.getDefaultDateRange();
      
      // Fetch sales data
      const salesData = await this.adapter.fetchSales(this.config.clientId, dateRange);
      
      // Process in batches if needed
      const batchSize = this.config.batchSize || this.getDefaultBatchSize();
      const batches = this.chunkArray(salesData, batchSize);
      
      let totalProcessed = 0;
      const errors: string[] = [];

      for (let i = 0; i < batches.length; i++) {
        try {
          const batch = batches[i];
          await this.processBatch(batch, i + 1, batches.length);
          totalProcessed += batch.length;
        } catch (error) {
          const errorMsg = `Batch ${i + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      const result: SyncResult = {
        success,
        message: success 
          ? `Sync completed successfully. Processed ${totalProcessed} records.`
          : `Sync completed with ${errors.length} errors. Processed ${totalProcessed} records.`,
        recordsProcessed: totalProcessed,
        timestamp: new Date().toISOString(),
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          duration,
          posProvider: this.config.posType,
          syncType: 'manual',
          batchCount: batches.length
        }
      };

      console.log(`[POS Sync] Completed sync for ${this.config.clientId}:`, result);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      console.error(`[POS Sync] Sync failed for ${this.config.clientId}:`, error);
      
      return {
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        errors: [errorMessage],
        metadata: {
          duration,
          posProvider: this.config.posType,
          syncType: 'manual'
        }
      };
    }
  }

  /**
   * Validates the POS connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      return await this.adapter.validateConnection();
    } catch (error) {
      console.error(`[POS Sync] Connection validation failed:`, error);
      return false;
    }
  }

  /**
   * Gets the last sync timestamp
   */
  async getLastSync(): Promise<string | null> {
    try {
      return await this.adapter.getLastSync?.() || null;
    } catch (error) {
      console.error(`[POS Sync] Error getting last sync:`, error);
      return null;
    }
  }

  /**
   * Gets adapter metadata
   */
  getAdapterInfo() {
    return {
      name: this.adapter.name,
      version: this.adapter.version,
      features: this.adapter.getSupportedFeatures?.() || [],
      metadata: this.adapter.getMetadata?.() || {}
    };
  }

  /**
   * Processes a batch of sales data
   */
  private async processBatch(batch: TupaSalesData[], batchNumber: number, totalBatches: number): Promise<void> {
    console.log(`[POS Sync] Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
    
    // Here you would typically:
    // 1. Store the data in database
    // 2. Transform for external systems (Odoo, etc.)
    // 3. Apply business logic
    // 4. Generate notifications/alerts
    
    // For now, just simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Gets default date range (last 24 hours)
   */
  private async getDefaultDateRange(): Promise<{ from: string; to: string }> {
    const lastSync = await this.getLastSync();
    const now = new Date();
    const from = lastSync ? new Date(lastSync) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      from: from.toISOString(),
      to: now.toISOString()
    };
  }

  /**
   * Gets default batch size based on POS type
   */
  private getDefaultBatchSize(): number {
    const registryConfig = posRegistry[this.config.posType];
    return registryConfig?.metadata.batchSizeLimit || 100;
  }

  /**
   * Splits array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/**
 * Factory function to create a sync service
 */
export function createSyncService(config: SyncConfig): POSSyncService {
  return new POSSyncService(config);
}

/**
 * Quick sync function for legacy compatibility
 */
export async function syncPOS(clientId: string, posType: string, posConfig: any): Promise<SyncResult> {
  const syncService = createSyncService({
    clientId,
    posType,
    posConfig,
    simulationMode: false
  });
  
  return await syncService.sync();
}

/**
 * Validates all registered POS adapters
 */
export async function validateAllAdapters(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  for (const [posType, config] of Object.entries(posRegistry)) {
    try {
      const adapter = config.createAdapter({});
      results[posType] = await adapter.validateConnection();
    } catch (error) {
      console.error(`Error validating ${posType}:`, error);
      results[posType] = false;
    }
  }
  
  return results;
}