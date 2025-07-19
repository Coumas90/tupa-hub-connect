import type { TupaSalesData } from '../pos/pos.registry';

export interface OdooSyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  errors?: string[];
}

export async function syncSalesToOdoo(clientId: string, sales: TupaSalesData[]): Promise<OdooSyncResult> {
  // Simular sincronización con Odoo
  console.log(`Syncing ${sales.length} sales to Odoo for client ${clientId}`);
  
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simular algunos fallos ocasionales
  const failedCount = Math.floor(Math.random() * 0.1 * sales.length);
  const syncedCount = sales.length - failedCount;
  
  const result: OdooSyncResult = {
    success: failedCount === 0,
    synced_count: syncedCount,
    failed_count: failedCount,
    errors: failedCount > 0 ? [`Failed to sync ${failedCount} records`] : undefined
  };
  
  console.log('Odoo sync result:', result);
  return result;
}