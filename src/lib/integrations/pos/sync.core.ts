import { getClientConfig } from '../config/client.config';
import { legacyPosRegistry } from '../../../integrations/pos/registry';
import { loadMockData } from '../mock/mock.loader';
import { storeParsedSales } from '../storage/sales.storage';
import { syncSalesToOdoo } from '../odoo/odoo.sync';
import { enqueueSyncTask } from '../queue/sync.queue';
import { integrationLogger, logSuccess, logError, logInfo } from '../logger';
import { retryQueue } from '../retryQueue';

export interface SyncResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  timestamp: string;
}

export async function syncClientPOS(clientId: string): Promise<SyncResult> {
  const startTime = Date.now();
  
  try {
    logInfo(clientId, 'system', 'sync', 'Starting POS sync process');
    
    // Check circuit breaker
    const circuitState = integrationLogger.getCircuitState(clientId);
    if (circuitState?.is_paused) {
      const result: SyncResult = {
        success: false,
        message: `Sync blocked - circuit breaker is open: ${circuitState.pause_reason}`,
        timestamp: new Date().toISOString()
      };
      logError(clientId, 'system', 'sync', result.message);
      return result;
    }

    const client = await getClientConfig(clientId);
    
    if (!client) {
      const errorMsg = `Client configuration not found for ID: ${clientId}`;
      logError(clientId, 'system', 'sync', errorMsg);
      throw new Error(errorMsg);
    }

    logInfo(clientId, client.pos_type as any, 'sync', `Using POS type: ${client.pos_type}, simulation: ${client.simulation_mode}`);

    const posAdapter = legacyPosRegistry[client.pos_type];
    if (!posAdapter) {
      const errorMsg = `POS adapter not found for type: ${client.pos_type}`;
      logError(clientId, 'system', 'sync', errorMsg);
      throw new Error(errorMsg);
    }

    const { adapter } = posAdapter;

    if (client.simulation_mode) {
      logInfo(clientId, client.pos_type as any, 'fetch', 'Loading mock data for simulation');
      
      // Modo simulación: cargar datos mock y procesar
      const rawData = loadMockData(`${client.pos_type}.sample.json`);
      logInfo(clientId, client.pos_type as any, 'fetch', `Loaded ${rawData.sales?.length || 0} mock sales records`);
      
      logInfo(clientId, client.pos_type as any, 'map', 'Starting data transformation');
      const parsedSales = adapter.mapToTupa(rawData);
      logSuccess(clientId, client.pos_type as any, 'map', `Transformed ${parsedSales.length} sales records`);
      
      logInfo(clientId, 'system', 'sync', 'Storing parsed sales data');
      await storeParsedSales(clientId, parsedSales);
      logSuccess(clientId, 'system', 'sync', `Stored ${parsedSales.length} sales records`);
      
      logInfo(clientId, 'odoo', 'sync', 'Starting Odoo synchronization');
      const odooResult = await syncSalesToOdoo(clientId, parsedSales);
      
      if (odooResult.success) {
        logSuccess(clientId, 'odoo', 'sync', `Synced ${odooResult.synced_count} records to Odoo`);
      } else {
        logError(clientId, 'odoo', 'sync', `Odoo sync partially failed: ${odooResult.failed_count} errors`);
      }
      
      const duration = Date.now() - startTime;
      const result: SyncResult = {
        success: true,
        message: `Simulation sync completed for ${client.pos_type}`,
        recordsProcessed: parsedSales.length,
        timestamp: new Date().toISOString()
      };
      
      logSuccess(clientId, 'system', 'sync', `Sync completed successfully in ${duration}ms`, { 
        duration, 
        records: parsedSales.length,
        odoo_result: odooResult 
      });
      
      return result;
    } else {
      logInfo(clientId, 'system', 'sync', 'Enqueueing production sync task');
      
      // Modo producción: enviar a cola asíncrona
      await enqueueSyncTask(clientId, 'sales.sync');
      
      const result: SyncResult = {
        success: true,
        message: `Sync task queued for client ${clientId}`,
        timestamp: new Date().toISOString()
      };
      
      logSuccess(clientId, 'system', 'sync', result.message);
      return result;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    
    logError(clientId, 'system', 'sync', `Sync failed after ${duration}ms: ${errorMessage}`, { 
      duration, 
      error: error instanceof Error ? error.stack : error 
    });

    // Enqueue retry for failed sync
    retryQueue.enqueueRetry(clientId, 'sync', 3, errorMessage);

    return {
      success: false,
      message: errorMessage,
      timestamp: new Date().toISOString()
    };
  }
}