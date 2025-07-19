import { mapOrderToOdoo } from './odoo.mapper';
import { createSaleOrder } from './odoo.service';

export async function syncSalesToOdoo(clientId: string, sales: any[]) {
  for (const sale of sales) {
    try {
      const order = mapOrderToOdoo(sale);
      await createSaleOrder(order);
    } catch (err: any) {
      console.error(`Sync failed: ${err.message}`);
    }
  }
}