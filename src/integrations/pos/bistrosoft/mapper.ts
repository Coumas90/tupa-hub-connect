import { BistrosoftRawSale, TupaSalesData } from './types';

/**
 * Maps Bistrosoft POS raw data to standardized Tupa format
 */
export function mapBistrosoftToTupa(bistrosoftSales: BistrosoftRawSale[]): TupaSalesData[] {
  return bistrosoftSales.map(sale => ({
    id: sale.ticket_id,
    timestamp: sale.timestamp,
    amount: sale.total_amount,
    items: sale.line_items.map(item => ({
      name: item.item_name,
      quantity: item.qty,
      price: item.total_price,
      category: item.category_name,
      sku: item.item_id,
      modifiers: item.modifiers?.map(mod => ({
        name: mod.modifier_name,
        price: mod.modifier_price
      })) || [],
      notes: item.special_instructions
    })),
    customer: sale.customer_info ? {
      id: sale.customer_info.customer_id,
      name: sale.customer_info.name,
      email: sale.customer_info.email,
      phone: sale.customer_info.phone,
      document: sale.customer_info.tax_id
    } : undefined,
    payment_method: sale.payment_type,
    pos_transaction_id: sale.ticket_id,
    metadata: {
      table_number: sale.table_id,
      waiter_id: sale.server_id,
      mesa: parseInt(sale.table_id) || undefined,
      mozo: sale.server_name,
      descuentos: sale.discount_amount,
      pos_provider: 'bistrosoft'
    }
  }));
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