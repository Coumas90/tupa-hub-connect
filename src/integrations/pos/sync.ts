import { getPOSAdapter } from './registry';
import { storeClientConsumption } from './consumption';
import { POSSyncLogger } from './sync-logger';

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  errors: string[];
  logId?: string;
  isPaused?: boolean;
  nextRetryAt?: Date;
}

/**
 * Core POS synchronization function with logging and error handling
 */
export async function syncPOS(
  clientId: string,
  posType: string,
  locationId?: string,
  forceSync: boolean = false
): Promise<SyncResult> {
  let logId: string | undefined;
  
  try {
    console.log(`[POS Sync] Starting sync for client ${clientId} (${posType})`);
    
    // Check if sync is allowed (respects auto-pause)
    if (!forceSync) {
      const canSyncResult = await POSSyncLogger.canSync(clientId);
      if (!canSyncResult.allowed) {
        console.warn(`[POS Sync] Sync blocked: ${canSyncResult.reason}`);
        return {
          success: false,
          recordsProcessed: 0,
          recordsSuccess: 0,
          recordsFailed: 0,
          errors: [canSyncResult.reason || 'Sync not allowed'],
          isPaused: true,
          nextRetryAt: canSyncResult.nextAllowedAt ? new Date(canSyncResult.nextAllowedAt) : undefined
        };
      }
    }

    // Start sync logging
    logId = await POSSyncLogger.startSync(clientId, posType, 'sync', {
      location_id: locationId,
      force_sync: forceSync
    });

    // Get POS adapter
    const adapter = getPOSAdapter(posType, {});
    if (!adapter) {
      throw new Error(`No adapter found for POS type: ${posType}`);
    }

    console.log(`[POS Sync] Using ${posType} adapter for client ${clientId}`);

    // Fetch sales data
    const salesData = await adapter.fetchSales(clientId, { from: '', to: '' });
    console.log(`[POS Sync] Fetched ${salesData.length} sales records`);

    if (salesData.length === 0) {
      await POSSyncLogger.logSuccess(logId, 0, 0, {
        message: 'No sales data found'
      });

      return {
        success: true,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 0,
        errors: [],
        logId
      };
    }

    // Map to standardized format
    const mappedData = adapter.mapToTupa(salesData);
    console.log(`[POS Sync] Mapped ${mappedData.length} sales records`);

    // Store consumption data
    const storeResult = await storeClientConsumption(clientId, mappedData, locationId);
    
    if (!storeResult.success) {
      const errorMessage = storeResult.errors?.join(', ') || 'Failed to store consumption data';
      
      const retryResult = await POSSyncLogger.logError(
        logId,
        errorMessage,
        'STORE_CONSUMPTION_FAILED',
        mappedData.length,
        mappedData.length,
        { store_result: storeResult }
      );

      return {
        success: false,
        recordsProcessed: mappedData.length,
        recordsSuccess: 0,
        recordsFailed: mappedData.length,
        errors: storeResult.errors || [errorMessage],
        logId,
        isPaused: retryResult.isPaused,
        nextRetryAt: retryResult.nextRetryAt
      };
    }

    // Log success
    await POSSyncLogger.logSuccess(
      logId,
      mappedData.length,
      mappedData.length,
      {
        consumption_id: storeResult.consumptionId,
        message: 'Successfully processed all sales data'
      }
    );

    console.log(`[POS Sync] Successfully completed sync for client ${clientId}`);

    return {
      success: true,
      recordsProcessed: mappedData.length,
      recordsSuccess: mappedData.length,
      recordsFailed: 0,
      errors: [],
      logId
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    console.error(`[POS Sync] Error syncing client ${clientId}:`, error);

    if (logId) {
      const retryResult = await POSSyncLogger.logError(
        logId,
        errorMessage,
        'SYNC_ERROR',
        0,
        0,
        { error: error instanceof Error ? error.stack : String(error) }
      );

      return {
        success: false,
        recordsProcessed: 0,
        recordsSuccess: 0,
        recordsFailed: 0,
        errors: [errorMessage],
        logId,
        isPaused: retryResult.isPaused,
        nextRetryAt: retryResult.nextRetryAt
      };
    }

    return {
      success: false,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      errors: [errorMessage]
    };
  }
}

/**
 * Syncs multiple clients in parallel with logging
 */
export async function syncMultipleClients(
  clients: Array<{ clientId: string; posType: string; locationId?: string }>,
  forceSync: boolean = false
): Promise<Record<string, SyncResult>> {
  const results: Record<string, SyncResult> = {};
  
  console.log(`[POS Sync] Starting batch sync for ${clients.length} clients`);
  
  const syncPromises = clients.map(async (client) => {
    const result = await syncPOS(client.clientId, client.posType, client.locationId, forceSync);
    results[client.clientId] = result;
    return result;
  });

  await Promise.allSettled(syncPromises);
  
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`[POS Sync] Batch sync completed: ${successCount}/${clients.length} successful`);
  
  return results;
}