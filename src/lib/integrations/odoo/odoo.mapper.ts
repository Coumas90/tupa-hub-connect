import type { TupaSalesData } from '../pos/pos.registry';

export interface OdooSaleOrder {
  partner_id: number | [number, string];
  date_order: string;
  order_line: Array<[number, number, OdooOrderLine]>;
  payment_term_id?: number;
  pricelist_id?: number;
  team_id?: number;
  user_id?: number;
  origin?: string;
  client_order_ref?: string;
  note?: string;
}

export interface OdooOrderLine {
  name: string;
  product_uom_qty: number;
  price_unit: number;
  product_id?: number | [number, string];
  tax_id?: Array<[number, number, number[]]>;
}

export interface OdooPartner {
  name: string;
  email?: string;
  phone?: string;
  is_company: boolean;
  customer_rank: number;
  supplier_rank: number;
  vat?: string;
  street?: string;
  city?: string;
  zip?: string;
  country_id?: number | [number, string];
  state_id?: number | [number, string];
}

export class OdooMapper {
  private static readonly DEFAULT_CUSTOMER_ID = 1; // Odoo's default customer
  private static readonly DEFAULT_PRODUCT_ID = 1; // Default product for unmapped items

  static mapSaleToOdoo(sale: TupaSalesData, customerMapping?: Map<string, number>): OdooSaleOrder {
    const partnerId = sale.customer?.id 
      ? customerMapping?.get(sale.customer.id) || this.DEFAULT_CUSTOMER_ID
      : this.DEFAULT_CUSTOMER_ID;

    const orderLines: Array<[number, number, OdooOrderLine]> = sale.items.map(item => [
      0, // Create operation
      0, // Temporary ID
      {
        name: item.name,
        product_uom_qty: item.quantity,
        price_unit: item.price,
        product_id: this.DEFAULT_PRODUCT_ID // In production, map to real products
      }
    ]);

    return {
      partner_id: partnerId,
      date_order: sale.timestamp,
      order_line: orderLines,
      origin: `POS-${sale.pos_transaction_id}`,
      client_order_ref: sale.id,
      note: `Imported from ${sale.metadata?.pos_provider || 'POS'} - Payment: ${sale.payment_method}`
    };
  }

  static mapCustomerToOdoo(customer: NonNullable<TupaSalesData['customer']>): OdooPartner {
    return {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      is_company: false,
      customer_rank: 1,
      supplier_rank: 0,
      vat: customer.document
    };
  }

  static mapStockMove(sale: TupaSalesData, warehouseId = 1): any {
    return sale.items.map(item => ({
      name: `Sale: ${item.name}`,
      product_id: this.DEFAULT_PRODUCT_ID,
      product_uom_qty: item.quantity,
      location_id: warehouseId, // Source location
      location_dest_id: 5, // Customer location (standard)
      origin: `POS-${sale.pos_transaction_id}`,
      date: sale.timestamp
    }));
  }

  static mapAccountMove(sale: TupaSalesData, partnerId: number): any {
    const totalAmount = sale.amount;
    
    return {
      partner_id: partnerId,
      move_type: 'out_invoice',
      invoice_date: sale.timestamp.split('T')[0],
      invoice_origin: `POS-${sale.pos_transaction_id}`,
      invoice_line_ids: sale.items.map(item => [0, 0, {
        name: item.name,
        quantity: item.quantity,
        price_unit: item.price,
        product_id: this.DEFAULT_PRODUCT_ID
      }])
    };
  }

  static validateSaleData(sale: TupaSalesData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!sale.id) errors.push('Sale ID is required');
    if (!sale.timestamp) errors.push('Timestamp is required');
    if (!sale.amount || sale.amount <= 0) errors.push('Amount must be greater than 0');
    if (!sale.items || sale.items.length === 0) errors.push('At least one item is required');
    if (!sale.pos_transaction_id) errors.push('POS transaction ID is required');

    sale.items.forEach((item, index) => {
      if (!item.name) errors.push(`Item ${index + 1}: name is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: quantity must be greater than 0`);
      if (item.price === undefined || item.price < 0) errors.push(`Item ${index + 1}: price must be >= 0`);
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}