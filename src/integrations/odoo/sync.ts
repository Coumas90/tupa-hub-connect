import { OdooClient, OdooConfig } from './client';
import { OdooMapper, OdooConsumptionRecord } from './mapper';
import { ConsumptionRecord, getClientConsumption } from '../pos/consumption';
import { supabase } from '@/integrations/supabase/client';

export interface OdooSyncConfig extends OdooConfig {
  retryAttempts?: number;
  retryDelayMs?: number;
  batchSize?: number;
  enableDeduplication?: boolean;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  duration: number;
  lastSyncAt: string;
}

export interface SyncProgress {
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'failed';
  currentRecord?: string;
  errors: string[];
}

/**
 * Odoo Synchronization Service
 */
export class OdooSyncService {
  private client: OdooClient;
  private config: OdooSyncConfig;
  private readonly MODEL_CONSUMPTION = 'tupa.consumption';
  private readonly MODEL_CONSUMPTION_LINE = 'tupa.consumption.line';

  constructor(config: OdooSyncConfig) {
    this.config = {
      retryAttempts: 3,
      retryDelayMs: 1000,
      batchSize: 50,
      enableDeduplication: true,
      ...config
    };
    
    this.client = new OdooClient(config);
  }

  /**
   * Push consumption data to Odoo with deduplication and retry logic
   */
  async pushConsumption(
    clientId: string,
    dateRange?: { from: string; to: string },
    locationId?: string
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let recordsProcessed = 0;
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsSkipped = 0;
    const errors: string[] = [];

    try {
      console.log(`[OdooSync] Starting consumption push for client ${clientId}`);

      // Validate Odoo connection
      const isConnected = await this.validateConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to Odoo server');
      }

      // Fetch consumption data from Tupa
      const consumptions = await getClientConsumption(clientId, dateRange, locationId);
      console.log(`[OdooSync] Fetched ${consumptions.length} consumption records`);

      if (consumptions.length === 0) {
        return this.createSuccessResult(startTime, 0, 0, 0, 0, []);
      }

      // Process in batches
      const batches = this.chunkArray(consumptions, this.config.batchSize!);
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        console.log(`[OdooSync] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} records)`);

        for (const consumption of batch) {
          try {
            const result = await this.processSingleConsumption(consumption, clientId);
            recordsProcessed++;

            switch (result.action) {
              case 'created':
                recordsCreated++;
                break;
              case 'updated':
                recordsUpdated++;
                break;
              case 'skipped':
                recordsSkipped++;
                break;
            }

            if (result.error) {
              errors.push(`Record ${consumption.id}: ${result.error}`);
            }

          } catch (error) {
            recordsProcessed++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Record ${consumption.id}: ${errorMsg}`);
            console.error(`[OdooSync] Error processing consumption ${consumption.id}:`, error);
          }
        }

        // Add delay between batches to avoid overwhelming Odoo
        if (batchIndex < batches.length - 1) {
          await this.delay(100);
        }
      }

      console.log(`[OdooSync] Completed push: ${recordsCreated} created, ${recordsUpdated} updated, ${recordsSkipped} skipped`);

      return this.createSuccessResult(
        startTime,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        errors
      );

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('[OdooSync] Push consumption failed:', error);
      
      return {
        success: false,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsSkipped,
        errors: [errorMsg, ...errors],
        duration: Date.now() - startTime,
        lastSyncAt: new Date().toISOString()
      };
    }
  }

  /**
   * Process a single consumption record with deduplication and retry logic
   */
  private async processSingleConsumption(
    consumption: ConsumptionRecord,
    clientId: string
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; odooId?: number; error?: string }> {
    const mapper = OdooMapper;
    const odooRecord = mapper.mapConsumptionToOdoo(consumption, clientId);

    // Validate record before processing
    const validation = mapper.validateOdooRecord(odooRecord);
    if (!validation.isValid) {
      return {
        action: 'skipped',
        error: `Validation failed: ${validation.errors.join(', ')}`
      };
    }

    // Check for existing record if deduplication is enabled
    if (this.config.enableDeduplication) {
      const existingId = await this.findExistingRecord(odooRecord.external_id);
      
      if (existingId) {
        // Update existing record
        try {
          const success = await this.updateWithRetry(existingId, odooRecord);
          if (success) {
            console.log(`[OdooSync] Updated existing consumption ${existingId}`);
            return { action: 'updated', odooId: existingId };
          } else {
            return { action: 'skipped', error: 'Update failed after retries' };
          }
        } catch (error) {
          return {
            action: 'skipped',
            error: `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }
      }
    }

    // Create new record
    try {
      const newId = await this.createWithRetry(odooRecord);
      console.log(`[OdooSync] Created new consumption ${newId}`);
      return { action: 'created', odooId: newId };
    } catch (error) {
      return {
        action: 'skipped',
        error: `Creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Find existing record by external ID
   */
  private async findExistingRecord(externalId: string): Promise<number | null> {
    try {
      const domain = OdooMapper.createExternalIdDomain(externalId);
      const ids = await this.client.search(this.MODEL_CONSUMPTION, domain, { limit: 1 });
      return ids.length > 0 ? ids[0] : null;
    } catch (error) {
      console.error('[OdooSync] Error searching for existing record:', error);
      return null;
    }
  }

  /**
   * Create record with retry logic
   */
  private async createWithRetry(record: OdooConsumptionRecord): Promise<number> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const id = await this.client.create(this.MODEL_CONSUMPTION, record);
        console.log(`[OdooSync] Successfully created record ${id} on attempt ${attempt}`);
        return id;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown create error');
        console.warn(`[OdooSync] Create attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.retryAttempts!) {
          await this.delay(this.config.retryDelayMs! * attempt);
        }
      }
    }

    throw lastError || new Error('Create failed after all retry attempts');
  }

  /**
   * Update record with retry logic
   */
  private async updateWithRetry(id: number, record: Partial<OdooConsumptionRecord>): Promise<boolean> {
    let lastError: Error | null = null;

    // Remove fields that shouldn't be updated
    const { external_id, ...updateData } = record;

    for (let attempt = 1; attempt <= this.config.retryAttempts!; attempt++) {
      try {
        const success = await this.client.write(this.MODEL_CONSUMPTION, [id], {
          ...updateData,
          sync_timestamp: new Date().toISOString()
        });
        
        if (success) {
          console.log(`[OdooSync] Successfully updated record ${id} on attempt ${attempt}`);
          return true;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown update error');
        console.warn(`[OdooSync] Update attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.config.retryAttempts!) {
          await this.delay(this.config.retryDelayMs! * attempt);
        }
      }
    }

    throw lastError || new Error('Update failed after all retry attempts');
  }

  /**
   * Validate connection to Odoo
   */
  async validateConnection(): Promise<boolean> {
    try {
      return await this.client.validateConnection();
    } catch (error) {
      console.error('[OdooSync] Connection validation failed:', error);
      return false;
    }
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(clientId: string): Promise<any> {
    try {
      const domain = [['client_ref', '=', clientId]];
      const records = await this.client.searchRead(
        this.MODEL_CONSUMPTION,
        domain,
        ['consumption_date', 'total_amount', 'state', 'sync_timestamp'],
        { order: 'consumption_date desc', limit: 100 }
      );

      return OdooMapper.formatForDashboard(records);
    } catch (error) {
      console.error('[OdooSync] Error getting sync status:', error);
      return null;
    }
  }

  /**
   * Cleanup old consumption records
   */
  async cleanupOldRecords(daysOld: number = 90): Promise<{ deleted: number; errors: string[] }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const domain = [
        ['consumption_date', '<', cutoffDate.toISOString().split('T')[0]],
        ['state', '=', 'processed']
      ];

      const ids = await this.client.search(this.MODEL_CONSUMPTION, domain);
      
      if (ids.length === 0) {
        return { deleted: 0, errors: [] };
      }

      const success = await this.client.unlink(this.MODEL_CONSUMPTION, ids);
      
      if (success) {
        console.log(`[OdooSync] Cleaned up ${ids.length} old consumption records`);
        return { deleted: ids.length, errors: [] };
      } else {
        return { deleted: 0, errors: ['Failed to delete records'] };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown cleanup error';
      console.error('[OdooSync] Cleanup failed:', error);
      return { deleted: 0, errors: [errorMsg] };
    }
  }

  /**
   * Get Odoo server information
   */
  async getServerInfo(): Promise<any> {
    try {
      return await this.client.getServerInfo();
    } catch (error) {
      console.error('[OdooSync] Error getting server info:', error);
      return null;
    }
  }

  /**
   * Close connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.logout();
      console.log('[OdooSync] Disconnected from Odoo server');
    } catch (error) {
      console.error('[OdooSync] Error during disconnect:', error);
    }
  }

  // Helper methods

  private createSuccessResult(
    startTime: number,
    processed: number,
    created: number,
    updated: number,
    skipped: number,
    errors: string[]
  ): SyncResult {
    return {
      success: true,
      recordsProcessed: processed,
      recordsCreated: created,
      recordsUpdated: updated,
      recordsSkipped: skipped,
      errors,
      duration: Date.now() - startTime,
      lastSyncAt: new Date().toISOString()
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function to create Odoo sync service
 */
export function createOdooSyncService(config: OdooSyncConfig): OdooSyncService {
  return new OdooSyncService(config);
}

/**
 * Quick sync function for immediate use
 */
export async function syncConsumptionToOdoo(
  config: OdooSyncConfig,
  clientId: string,
  dateRange?: { from: string; to: string },
  locationId?: string
): Promise<SyncResult> {
  const syncService = createOdooSyncService(config);
  
  try {
    const result = await syncService.pushConsumption(clientId, dateRange, locationId);
    await syncService.disconnect();
    return result;
  } catch (error) {
    await syncService.disconnect();
    throw error;
  }
}