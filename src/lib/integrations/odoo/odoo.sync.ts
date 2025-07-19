import { OdooClient } from './odoo.client';
import { OdooService } from './odoo.service';
import type { TupaSalesData } from '../pos/pos.registry';
import { logSuccess, logError, logInfo } from '../logger';

export interface OdooSyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors?: string[];
  odoo_ids?: number[];
}

export interface OdooClientConfig {
  url: string;
  database: string;
  username: string;
  password: string;
  timeout?: number;
  sync_options?: {
    create_customers: boolean;
    create_invoices: boolean;
    update_stock: boolean;
  };
}

// Mock configuration - en producción vendría de Supabase
const mockOdooConfigs: Record<string, OdooClientConfig> = {
  'client_001': {
    url: 'https://demo.odoo.com',
    database: 'demo_db',
    username: 'admin',
    password: 'admin123',
    timeout: 30000,
    sync_options: {
      create_customers: true,
      create_invoices: false,
      update_stock: true
    }
  },
  'client_002': {
    url: 'https://bistronorte.odoo.com',
    database: 'bistronorte_prod',
    username: 'api_user',
    password: 'secure_pass',
    timeout: 15000,
    sync_options: {
      create_customers: true,
      create_invoices: true,
      update_stock: false
    }
  }
};

async function getOdooConfig(clientId: string): Promise<OdooClientConfig | null> {
  // En producción, esto consultaría Supabase
  return mockOdooConfigs[clientId] || null;
}

export async function syncSalesToOdoo(clientId: string, sales: TupaSalesData[]): Promise<OdooSyncResult> {
  const startTime = Date.now();
  
  try {
    logInfo(clientId, 'odoo', 'sync', `Starting Odoo sync for ${sales.length} sales`);

    const config = await getOdooConfig(clientId);
    if (!config) {
      const error = `Odoo configuration not found for client ${clientId}`;
      logError(clientId, 'odoo', 'sync', error);
      return {
        success: false,
        synced_count: 0,
        failed_count: sales.length,
        errors: [error]
      };
    }

    // Initialize Odoo client and service
    const client = new OdooClient({
      url: config.url,
      database: config.database,
      username: config.username,
      password: config.password,
      timeout: config.timeout || 30000
    });

    const service = new OdooService(client);

    // Test connection first
    logInfo(clientId, 'odoo', 'auth', 'Testing Odoo connection');
    const isConnected = await service.testConnection();
    if (!isConnected) {
      const error = 'Failed to connect to Odoo';
      logError(clientId, 'odoo', 'auth', error);
      return {
        success: false,
        synced_count: 0,
        failed_count: sales.length,
        errors: [error]
      };
    }
    logSuccess(clientId, 'odoo', 'auth', 'Odoo connection established');

    // Process sales
    const results: { success: boolean; odoo_id?: number; error?: string }[] = [];
    const odooIds: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < sales.length; i++) {
      const sale = sales[i];
      
      try {
        logInfo(clientId, 'odoo', 'sync', `Processing sale ${i + 1}/${sales.length}: ${sale.id}`);
        
        const result = await service.createSaleOrder(sale);
        results.push(result);

        if (result.success && result.odoo_id) {
          odooIds.push(result.odoo_id);
          logSuccess(clientId, 'odoo', 'sync', `Sale ${sale.id} synced to Odoo ID: ${result.odoo_id}`);
          
          // Optional: Create invoice if configured
          if (config.sync_options?.create_invoices) {
            // Implementation would go here
            logInfo(clientId, 'odoo', 'sync', `Invoice creation skipped for sale ${sale.id} (not implemented)`);
          }
          
          // Optional: Update stock if configured
          if (config.sync_options?.update_stock) {
            // Implementation would go here
            logInfo(clientId, 'odoo', 'sync', `Stock update skipped for sale ${sale.id} (not implemented)`);
          }
        } else {
          errors.push(`Sale ${sale.id}: ${result.error}`);
          logError(clientId, 'odoo', 'sync', `Failed to sync sale ${sale.id}: ${result.error}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Sale ${sale.id}: ${errorMsg}`);
        logError(clientId, 'odoo', 'sync', `Exception syncing sale ${sale.id}: ${errorMsg}`);
        results.push({ success: false, error: errorMsg });
      }
    }

    const syncedCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const duration = Date.now() - startTime;

    const finalResult: OdooSyncResult = {
      success: failedCount === 0,
      synced_count: syncedCount,
      failed_count: failedCount,
      errors: errors.length > 0 ? errors : undefined,
      odoo_ids: odooIds
    };

    logSuccess(clientId, 'odoo', 'sync', `Odoo sync completed in ${duration}ms: ${syncedCount} success, ${failedCount} failed`, {
      duration,
      synced_count: syncedCount,
      failed_count: failedCount,
      odoo_ids: odooIds
    });

    return finalResult;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    
    logError(clientId, 'odoo', 'sync', `Odoo sync failed after ${duration}ms: ${errorMessage}`, {
      duration,
      error: error instanceof Error ? error.stack : error
    });

    return {
      success: false,
      synced_count: 0,
      failed_count: sales.length,
      errors: [errorMessage]
    };
  }
}