import { ConsumptionRecord } from '../pos/consumption';

/**
 * Odoo consumption record structure
 */
export interface OdooConsumptionRecord {
  name: string;
  client_ref: string;
  location_ref?: string;
  consumption_date: string;
  total_amount: number;
  total_items: number;
  average_order_value: number;
  currency_id?: number;
  category_lines: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
  payment_method_lines: Array<{
    payment_method: string;
    amount: number;
  }>;
  metadata_json: string;
  state: 'draft' | 'confirmed' | 'processed';
  sync_source: string;
  sync_timestamp: string;
  external_id: string;
}

/**
 * Odoo consumption line structure
 */
export interface OdooConsumptionLine {
  consumption_id: number;
  name: string;
  category: string;
  quantity: number;
  unit_price?: number;
  total_amount?: number;
  product_id?: number;
}

/**
 * Maps Tupa consumption data to Odoo format
 */
export class OdooMapper {
  private static readonly CURRENCY_USD_ID = 2; // Default USD currency ID in Odoo
  private static readonly DEFAULT_COMPANY_ID = 1;

  /**
   * Maps a Tupa consumption record to Odoo consumption record
   */
  static mapConsumptionToOdoo(
    consumption: ConsumptionRecord,
    clientRef?: string
  ): OdooConsumptionRecord {
    const metadata = consumption.metadata as any || {};
    
    // Generate external ID for deduplication
    const externalId = this.generateExternalId(consumption);
    
    // Map category data to consumption lines
    const categoryLines = consumption.top_categories.map((category, index) => ({
      name: `Category: ${category}`,
      quantity: Math.floor(consumption.total_items / consumption.top_categories.length), // Distribute items evenly
      category: category
    }));

    // Map payment methods to payment lines
    const paymentMethods = consumption.payment_methods || {};
    const paymentMethodLines = Object.entries(paymentMethods).map(([method, amount]) => ({
      payment_method: method,
      amount: typeof amount === 'number' ? amount : 0
    }));

    const odooRecord: OdooConsumptionRecord = {
      name: `Consumption ${consumption.date} - ${clientRef || consumption.client_id}`,
      client_ref: clientRef || consumption.client_id,
      location_ref: consumption.location_id,
      consumption_date: consumption.date,
      total_amount: consumption.total_amount,
      total_items: consumption.total_items,
      average_order_value: consumption.average_order_value,
      currency_id: this.CURRENCY_USD_ID,
      category_lines: categoryLines,
      payment_method_lines: paymentMethodLines,
      metadata_json: JSON.stringify({
        ...metadata,
        tupa_consumption_id: consumption.id,
        original_created_at: consumption.created_at,
        original_updated_at: consumption.updated_at
      }),
      state: 'draft',
      sync_source: 'tupa_pos',
      sync_timestamp: new Date().toISOString(),
      external_id: externalId
    };

    return odooRecord;
  }

  /**
   * Maps consumption categories to separate Odoo consumption lines
   */
  static mapCategoriesToLines(
    consumption: ConsumptionRecord,
    consumptionId: number
  ): OdooConsumptionLine[] {
    const lines: OdooConsumptionLine[] = [];
    
    // Calculate average price per item
    const avgItemPrice = consumption.total_items > 0 
      ? consumption.total_amount / consumption.total_items 
      : 0;

    consumption.top_categories.forEach((category, index) => {
      // Distribute items evenly among categories (simplified approach)
      const categoryItems = Math.floor(consumption.total_items / consumption.top_categories.length);
      const remainderItems = index === consumption.top_categories.length - 1 
        ? consumption.total_items % consumption.top_categories.length 
        : 0;
      
      const totalItems = categoryItems + remainderItems;
      const totalAmount = totalItems * avgItemPrice;

      lines.push({
        consumption_id: consumptionId,
        name: `${category} Items`,
        category: category,
        quantity: totalItems,
        unit_price: avgItemPrice,
        total_amount: totalAmount
      });
    });

    return lines;
  }

  /**
   * Generates a unique external ID for deduplication
   */
  static generateExternalId(consumption: ConsumptionRecord): string {
    const clientId = consumption.client_id;
    const date = consumption.date;
    const locationId = consumption.location_id || 'main';
    
    // Create deterministic hash-like string
    const baseString = `${clientId}_${date}_${locationId}`;
    return `tupa_consumption_${baseString}`;
  }

  /**
   * Maps Odoo consumption record back to Tupa format
   */
  static mapOdooToConsumption(odooRecord: any): Partial<ConsumptionRecord> {
    let metadata = {};
    
    try {
      metadata = JSON.parse(odooRecord.metadata_json || '{}');
    } catch (error) {
      console.warn('[OdooMapper] Failed to parse metadata JSON:', error);
    }

    return {
      client_id: odooRecord.client_ref,
      location_id: odooRecord.location_ref,
      date: odooRecord.consumption_date,
      total_amount: odooRecord.total_amount,
      total_items: odooRecord.total_items,
      average_order_value: odooRecord.average_order_value,
      top_categories: odooRecord.category_lines?.map((line: any) => line.category) || [],
      payment_methods: this.reconstructPaymentMethods(odooRecord.payment_method_lines || []),
      metadata: {
        ...metadata,
        odoo_id: odooRecord.id,
        odoo_state: odooRecord.state,
        sync_source: odooRecord.sync_source,
        odoo_sync_timestamp: odooRecord.sync_timestamp
      }
    };
  }

  /**
   * Reconstructs payment methods object from Odoo lines
   */
  private static reconstructPaymentMethods(paymentLines: any[]): Record<string, number> {
    const paymentMethods: Record<string, number> = {};
    
    paymentLines.forEach(line => {
      if (line.payment_method && typeof line.amount === 'number') {
        paymentMethods[line.payment_method] = line.amount;
      }
    });
    
    return paymentMethods;
  }

  /**
   * Validates Odoo consumption record structure
   */
  static validateOdooRecord(record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!record.client_ref) errors.push('client_ref is required');
    if (!record.consumption_date) errors.push('consumption_date is required');
    if (typeof record.total_amount !== 'number') errors.push('total_amount must be a number');
    if (typeof record.total_items !== 'number') errors.push('total_items must be a number');
    if (!record.external_id) errors.push('external_id is required');

    // Data type validation
    if (record.total_amount < 0) errors.push('total_amount cannot be negative');
    if (record.total_items < 0) errors.push('total_items cannot be negative');

    // Date validation
    if (record.consumption_date) {
      const date = new Date(record.consumption_date);
      if (isNaN(date.getTime())) {
        errors.push('consumption_date must be a valid date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Creates search domain for finding existing consumption records
   */
  static createSearchDomain(
    clientRef: string,
    date: string,
    locationRef?: string
  ): any[] {
    const domain = [
      ['client_ref', '=', clientRef],
      ['consumption_date', '=', date]
    ];

    if (locationRef) {
      domain.push(['location_ref', '=', locationRef]);
    }

    return domain;
  }

  /**
   * Creates external ID search domain for deduplication
   */
  static createExternalIdDomain(externalId: string): any[] {
    return [['external_id', '=', externalId]];
  }

  /**
   * Formats consumption data for Odoo dashboard display
   */
  static formatForDashboard(consumptions: any[]): any {
    const totalAmount = consumptions.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const totalItems = consumptions.reduce((sum, c) => sum + (c.total_items || 0), 0);
    const avgOrderValue = consumptions.length > 0 
      ? totalAmount / consumptions.length 
      : 0;

    // Group by categories
    const categoryStats: Record<string, { quantity: number; amount: number }> = {};
    consumptions.forEach(consumption => {
      if (consumption.category_lines) {
        consumption.category_lines.forEach((line: any) => {
          if (!categoryStats[line.category]) {
            categoryStats[line.category] = { quantity: 0, amount: 0 };
          }
          categoryStats[line.category].quantity += line.quantity;
          categoryStats[line.category].amount += line.total_amount || 0;
        });
      }
    });

    return {
      summary: {
        total_records: consumptions.length,
        total_amount: totalAmount,
        total_items: totalItems,
        average_order_value: avgOrderValue
      },
      categories: categoryStats,
      date_range: {
        from: consumptions.length > 0 ? Math.min(...consumptions.map(c => new Date(c.consumption_date).getTime())) : null,
        to: consumptions.length > 0 ? Math.max(...consumptions.map(c => new Date(c.consumption_date).getTime())) : null
      }
    };
  }
}