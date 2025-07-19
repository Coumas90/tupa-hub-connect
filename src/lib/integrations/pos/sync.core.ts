import { getClientConfig } from '../config/client.config';
import { posRegistry } from './pos.registry';
import { loadMockData } from '../mock/mock.loader';
import { storeParsedSales } from '../storage/sales.storage';
import { syncSalesToOdoo } from '../odoo/odoo.sync';
import { enqueueSyncTask } from '../queue/sync.queue';

export interface SyncResult {
  success: boolean;
  message: string;
  recordsProcessed?: number;
  timestamp: string;
}

export async function syncClientPOS(clientId: string): Promise<SyncResult> {
  try {
    const client = await getClientConfig(clientId);
    
    if (!client) {
      throw new Error(`Client configuration not found for ID: ${clientId}`);
    }

    const posAdapter = posRegistry[client.pos_type];
    if (!posAdapter) {
      throw new Error(`POS adapter not found for type: ${client.pos_type}`);
    }

    const { adapter } = posAdapter;

    if (client.simulation_mode) {
      // Modo simulación: cargar datos mock y procesar
      const rawData = loadMockData(`${client.pos_type}.sample.json`);
      const parsedSales = adapter.mapToTupa(rawData);
      
      await storeParsedSales(clientId, parsedSales);
      const odooResult = await syncSalesToOdoo(clientId, parsedSales);
      
      return {
        success: true,
        message: `Simulation sync completed for ${client.pos_type}`,
        recordsProcessed: parsedSales.length,
        timestamp: new Date().toISOString()
      };
    } else {
      // Modo producción: enviar a cola asíncrona
      await enqueueSyncTask(clientId, 'sales.sync');
      
      return {
        success: true,
        message: `Sync task queued for client ${clientId}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown sync error',
      timestamp: new Date().toISOString()
    };
  }
}