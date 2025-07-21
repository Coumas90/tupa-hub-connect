import { BistrosoftRawSale, TupaSalesData } from './types';

/**
 * Maps Bistrosoft POS raw data to standardized Tupa format
 */
export function mapBistrosoftToTupa(bistrosoftSales: BistrosoftRawSale[]): TupaSalesData[] {
  return bistrosoftSales.map((sale, index) => {
    try {
      // Normalize timestamp
      const timestamp = normalizeBistrosoftTimestamp(sale.timestamp);
      
      // Map line items with validation
      const items = sale.line_items.map((item, itemIndex) => {
        // Calculate unit price for validation
        const unitPrice = item.qty > 0 ? item.total_price / item.qty : item.unit_price;
        
        return {
          name: item.item_name || `Item ${item.item_id}`,
          quantity: Math.max(1, item.qty || 1),
          price: Math.max(0, item.total_price || 0),
          category: item.category_name || 'General',
          sku: item.item_id || `bistrosoft-${sale.ticket_id}-${itemIndex}`,
          modifiers: item.modifiers?.map(mod => ({
            name: mod.modifier_name || 'Modifier',
            price: Math.max(0, mod.modifier_price || 0)
          })) || [],
          notes: item.special_instructions || undefined
        };
      });

      // Calculate and validate totals
      const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
      const expectedTotal = itemsTotal - (sale.discount_amount || 0) + (sale.tax_amount || 0);
      const finalAmount = Math.max(0, sale.total_amount || expectedTotal);

      return {
        id: sale.ticket_id || `bistrosoft-${Date.now()}-${index}`,
        timestamp,
        amount: finalAmount,
        items,
        customer: sale.customer_info ? {
          id: sale.customer_info.customer_id || undefined,
          name: sale.customer_info.name || undefined,
          email: sale.customer_info.email || undefined,
          phone: sale.customer_info.phone || undefined,
          document: sale.customer_info.tax_id || undefined
        } : undefined,
        payment_method: sale.payment_type || 'unknown',
        pos_transaction_id: sale.ticket_id || `bistrosoft-${Date.now()}-${index}`,
        metadata: {
          table_number: sale.table_id || undefined,
          waiter_id: sale.server_id || undefined,
          mesa: parseInt(sale.table_id) || undefined,
          mozo: sale.server_name || undefined,
          descuentos: Math.max(0, sale.discount_amount || 0),
          pos_provider: 'bistrosoft',
          original_total: sale.total_amount,
          items_total: itemsTotal,
          tax_amount: sale.tax_amount,
          server_info: {
            id: sale.server_id,
            name: sale.server_name
          }
        }
      };
    } catch (error) {
      console.error(`Error mapping Bistrosoft sale ${sale.ticket_id}:`, error);
      // Return a minimal valid structure for failed mappings
      return {
        id: sale.ticket_id || `bistrosoft-error-${index}`,
        timestamp: sale.timestamp || new Date().toISOString(),
        amount: Math.max(0, sale.total_amount || 0),
        items: [{
          name: 'Error - Could not map items',
          quantity: 1,
          price: Math.max(0, sale.total_amount || 0),
          category: 'Error'
        }],
        payment_method: sale.payment_type || 'unknown',
        pos_transaction_id: sale.ticket_id || `bistrosoft-error-${index}`,
        metadata: {
          pos_provider: 'bistrosoft',
          mapping_error: true,
          error_message: error instanceof Error ? error.message : 'Unknown mapping error'
        }
      };
    }
  });
}

/**
 * Validates Bistrosoft raw data structure
 */
export function validateBistrosoftData(data: any): data is BistrosoftRawSale[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(sale => (
    typeof sale === 'object' &&
    typeof sale.ticket_id === 'string' &&
    typeof sale.timestamp === 'string' &&
    typeof sale.total_amount === 'number' &&
    Array.isArray(sale.line_items)
  ));
}

/**
 * Normalizes Bistrosoft timestamps to ISO format
 */
export function normalizeBistrosoftTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp format');
    }
    return date.toISOString();
  } catch (error) {
    console.error('Error normalizing Bistrosoft timestamp:', error);
    return new Date().toISOString();
  }
}

/**
 * Calculates totals and validates data consistency
 */
export function validateBistrosoftSaleIntegrity(sale: BistrosoftRawSale): boolean {
  try {
    const itemsTotal = sale.line_items.reduce((sum, item) => sum + item.total_price, 0);
    const expectedTotal = itemsTotal - (sale.discount_amount || 0) + (sale.tax_amount || 0);
    
    // Allow for small floating point differences
    const tolerance = 0.01;
    return Math.abs(expectedTotal - sale.total_amount) <= tolerance;
  } catch (error) {
    console.error('Error validating Bistrosoft sale integrity:', error);
    return false;
  }
}

/**
 * Extracts customer insights from Bistrosoft data
 */
export function extractCustomerInsights(sales: BistrosoftRawSale[]) {
  const customerData = new Map();
  
  sales.forEach(sale => {
    if (sale.customer_info?.customer_id) {
      const customerId = sale.customer_info.customer_id;
      const existing = customerData.get(customerId) || {
        totalSpent: 0,
        visitCount: 0,
        averageOrderValue: 0,
        lastVisit: null,
        favoriteItems: new Map()
      };
      
      existing.totalSpent += sale.total_amount;
      existing.visitCount += 1;
      existing.averageOrderValue = existing.totalSpent / existing.visitCount;
      existing.lastVisit = sale.timestamp;
      
      // Track favorite items
      sale.line_items.forEach(item => {
        const count = existing.favoriteItems.get(item.item_name) || 0;
        existing.favoriteItems.set(item.item_name, count + item.qty);
      });
      
      customerData.set(customerId, existing);
    }
  });
  
  return customerData;
}