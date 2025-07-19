import { OdooClient } from './odoo.client';
import { OdooMapper, type OdooSaleOrder, type OdooPartner } from './odoo.mapper';
import type { TupaSalesData } from '../pos/pos.registry';

export class OdooService {
  private client: OdooClient;
  private customerCache: Map<string, number> = new Map();

  constructor(client: OdooClient) {
    this.client = client;
  }

  async createSaleOrder(saleData: TupaSalesData): Promise<{ success: boolean; odoo_id?: number; error?: string }> {
    try {
      // Validate data first
      const validation = OdooMapper.validateSaleData(saleData);
      if (!validation.valid) {
        return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
      }

      // Ensure customer exists in Odoo
      let partnerId = 1; // Default customer
      if (saleData.customer) {
        partnerId = await this.ensureCustomerExists(saleData.customer);
      }

      // Map to Odoo format
      const odooSale = OdooMapper.mapSaleToOdoo(saleData, this.customerCache);
      odooSale.partner_id = partnerId;

      // Create in Odoo
      const odooId = await this.client.create('sale.order', odooSale);
      
      return { success: true, odoo_id: odooId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Odoo error';
      return { success: false, error: errorMessage };
    }
  }

  async createCustomer(customerData: NonNullable<TupaSalesData['customer']>): Promise<number> {
    const odooPartner = OdooMapper.mapCustomerToOdoo(customerData);
    const partnerId = await this.client.create('res.partner', odooPartner);
    
    // Cache the mapping
    this.customerCache.set(customerData.id!, partnerId);
    
    return partnerId;
  }

  async ensureCustomerExists(customerData: NonNullable<TupaSalesData['customer']>): Promise<number> {
    // Check cache first
    if (customerData.id && this.customerCache.has(customerData.id)) {
      return this.customerCache.get(customerData.id)!;
    }

    // Search by email or name
    let domain = [];
    if (customerData.email) {
      domain = [['email', '=', customerData.email]];
    } else {
      domain = [['name', '=', customerData.name]];
    }

    const existingIds = await this.client.search('res.partner', domain, { limit: 1 });
    
    if (existingIds.length > 0) {
      const partnerId = existingIds[0];
      if (customerData.id) {
        this.customerCache.set(customerData.id, partnerId);
      }
      return partnerId;
    }

    // Create new customer
    return await this.createCustomer(customerData);
  }

  async createStockMovement(saleData: TupaSalesData): Promise<{ success: boolean; move_ids?: number[]; error?: string }> {
    try {
      const stockMoves = OdooMapper.mapStockMove(saleData);
      const moveIds: number[] = [];

      for (const move of stockMoves) {
        const moveId = await this.client.create('stock.move', move);
        moveIds.push(moveId);
      }

      return { success: true, move_ids: moveIds };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown stock error';
      return { success: false, error: errorMessage };
    }
  }

  async createInvoice(saleData: TupaSalesData, partnerId: number): Promise<{ success: boolean; invoice_id?: number; error?: string }> {
    try {
      const accountMove = OdooMapper.mapAccountMove(saleData, partnerId);
      const invoiceId = await this.client.create('account.move', accountMove);
      
      return { success: true, invoice_id: invoiceId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown invoice error';
      return { success: false, error: errorMessage };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.authenticate();
      // Try a simple read operation
      await this.client.search('res.partner', [], { limit: 1 });
      return true;
    } catch (error) {
      console.error('Odoo connection test failed:', error);
      return false;
    }
  }

  async getSaleOrderById(odooId: number): Promise<any> {
    try {
      const orders = await this.client.read('sale.order', [odooId], [
        'name', 'state', 'date_order', 'partner_id', 'amount_total', 'origin'
      ]);
      return orders[0] || null;
    } catch (error) {
      console.error('Error fetching sale order:', error);
      return null;
    }
  }

  clearCustomerCache(): void {
    this.customerCache.clear();
  }
}