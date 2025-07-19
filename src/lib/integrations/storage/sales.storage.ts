import type { TupaSalesData } from '../pos/pos.registry';

export interface StoredSale extends TupaSalesData {
  client_id: string;
  stored_at: string;
  processed: boolean;
  odoo_synced: boolean;
}

// Mock storage - en producción sería Supabase
const salesStorage: StoredSale[] = [];

export async function storeParsedSales(clientId: string, sales: TupaSalesData[]): Promise<void> {
  const timestamp = new Date().toISOString();
  
  const storedSales: StoredSale[] = sales.map(sale => ({
    ...sale,
    client_id: clientId,
    stored_at: timestamp,
    processed: true,
    odoo_synced: false
  }));

  // En producción, esto insertaría en Supabase
  salesStorage.push(...storedSales);
  
  // Sales stored successfully
}

export async function getSalesForClient(clientId: string, limit = 50): Promise<StoredSale[]> {
  // En producción, esto consultaría Supabase con filtros
  return salesStorage
    .filter(sale => sale.client_id === clientId)
    .slice(-limit);
}

export async function markSalesAsSynced(clientId: string, saleIds: string[]): Promise<void> {
  // En producción, esto actualizaría Supabase
  salesStorage.forEach(sale => {
    if (sale.client_id === clientId && saleIds.includes(sale.id)) {
      sale.odoo_synced = true;
    }
  });
}