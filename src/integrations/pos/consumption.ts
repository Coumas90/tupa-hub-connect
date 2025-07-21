import { supabase } from '@/integrations/supabase/client';
import { TupaSalesData } from './fudo/types';

// Consumption aggregation interfaces
export interface ConsumptionRecord {
  id: string;
  client_id: string;
  location_id?: string;
  date: string;
  total_amount: number;
  total_items: number;
  average_order_value: number;
  top_categories: string[];
  payment_methods: Record<string, number>;
  metadata: {
    pos_provider: string;
    sync_timestamp: string;
    sales_count: number;
    peak_hour?: number;
    customer_count?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recordsProcessed: number;
  recordsValid: number;
}

/**
 * Stores client consumption data aggregated from POS sales
 */
export async function storeClientConsumption(
  clientId: string, 
  salesData: TupaSalesData[],
  locationId?: string
): Promise<{ success: boolean; consumptionId?: string; errors?: string[] }> {
  try {
    console.log(`[Consumption Storage] Processing ${salesData.length} sales for client ${clientId}`);
    
    // Validate input data
    const validation = validateSalesData(salesData);
    if (!validation.isValid) {
      console.error('[Consumption Storage] Validation failed:', validation.errors);
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Aggregate consumption data
    const consumption = aggregateConsumptionData(clientId, salesData, locationId);
    
    // Store in database
    const { data, error } = await supabase
      .from('consumptions')
      .insert(consumption)
      .select('id')
      .single();

    if (error) {
      console.error('[Consumption Storage] Database error:', error);
      return {
        success: false,
        errors: [`Database error: ${error.message}`]
      };
    }

    console.log(`[Consumption Storage] Successfully stored consumption record ${data.id}`);
    return {
      success: true,
      consumptionId: data.id
    };

  } catch (error) {
    console.error('[Consumption Storage] Unexpected error:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown storage error']
    };
  }
}

/**
 * Validates sales data before processing
 */
export function validateSalesData(salesData: TupaSalesData[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validCount = 0;

  if (!Array.isArray(salesData)) {
    errors.push('Sales data must be an array');
    return { isValid: false, errors, warnings, recordsProcessed: 0, recordsValid: 0 };
  }

  if (salesData.length === 0) {
    warnings.push('No sales data provided');
    return { isValid: true, errors, warnings, recordsProcessed: 0, recordsValid: 0 };
  }

  salesData.forEach((sale, index) => {
    const saleErrors: string[] = [];

    // Required field validation
    if (!sale.id) saleErrors.push(`Sale ${index}: Missing ID`);
    if (!sale.timestamp) saleErrors.push(`Sale ${index}: Missing timestamp`);
    if (!sale.pos_transaction_id) saleErrors.push(`Sale ${index}: Missing POS transaction ID`);

    // Data type validation
    if (typeof sale.amount !== 'number' || sale.amount < 0) {
      saleErrors.push(`Sale ${index}: Invalid amount (${sale.amount})`);
    }

    // Items validation
    if (!Array.isArray(sale.items) || sale.items.length === 0) {
      saleErrors.push(`Sale ${index}: No items found`);
    } else {
      sale.items.forEach((item, itemIndex) => {
        if (!item.name) saleErrors.push(`Sale ${index}, Item ${itemIndex}: Missing name`);
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          saleErrors.push(`Sale ${index}, Item ${itemIndex}: Invalid quantity`);
        }
        if (typeof item.price !== 'number' || item.price < 0) {
          saleErrors.push(`Sale ${index}, Item ${itemIndex}: Invalid price`);
        }
      });
    }

    // Timestamp validation
    if (sale.timestamp) {
      const date = new Date(sale.timestamp);
      if (isNaN(date.getTime())) {
        saleErrors.push(`Sale ${index}: Invalid timestamp format`);
      } else {
        // Check if timestamp is in the future
        if (date > new Date()) {
          warnings.push(`Sale ${index}: Future timestamp detected`);
        }
        // Check if timestamp is too old (more than 1 year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (date < oneYearAgo) {
          warnings.push(`Sale ${index}: Very old timestamp detected`);
        }
      }
    }

    if (saleErrors.length === 0) {
      validCount++;
    } else {
      errors.push(...saleErrors);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recordsProcessed: salesData.length,
    recordsValid: validCount
  };
}

/**
 * Aggregates sales data into consumption metrics
 */
function aggregateConsumptionData(
  clientId: string, 
  salesData: TupaSalesData[], 
  locationId?: string
): Omit<ConsumptionRecord, 'id' | 'created_at' | 'updated_at'> {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Calculate basic metrics
  const totalAmount = salesData.reduce((sum, sale) => sum + sale.amount, 0);
  const totalItems = salesData.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const averageOrderValue = salesData.length > 0 ? totalAmount / salesData.length : 0;

  // Extract categories (top 5)
  const categoryCount = new Map<string, number>();
  salesData.forEach(sale => {
    sale.items.forEach(item => {
      if (item.category) {
        const current = categoryCount.get(item.category) || 0;
        categoryCount.set(item.category, current + item.quantity);
      }
    });
  });
  
  const topCategories = Array.from(categoryCount.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);

  // Payment methods aggregation
  const paymentMethods: Record<string, number> = {};
  salesData.forEach(sale => {
    const method = sale.payment_method || 'unknown';
    paymentMethods[method] = (paymentMethods[method] || 0) + sale.amount;
  });

  // Find peak hour (hour with most sales)
  const hourCount = new Map<number, number>();
  salesData.forEach(sale => {
    const hour = new Date(sale.timestamp).getHours();
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  });
  
  const peakHour = Array.from(hourCount.entries())
    .sort(([,a], [,b]) => b - a)[0]?.[0];

  // Count unique customers
  const uniqueCustomers = new Set();
  salesData.forEach(sale => {
    if (sale.customer?.id) {
      uniqueCustomers.add(sale.customer.id);
    }
  });

  // Determine POS provider
  const posProvider = salesData[0]?.metadata?.pos_provider || 'unknown';

  return {
    client_id: clientId,
    location_id: locationId,
    date,
    total_amount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
    total_items: totalItems,
    average_order_value: Math.round(averageOrderValue * 100) / 100,
    top_categories: topCategories,
    payment_methods: paymentMethods,
    metadata: {
      pos_provider: posProvider,
      sync_timestamp: now.toISOString(),
      sales_count: salesData.length,
      peak_hour: peakHour,
      customer_count: uniqueCustomers.size || undefined
    }
  };
}

/**
 * Retrieves consumption data for a client
 */
export async function getClientConsumption(
  clientId: string,
  dateRange?: { from: string; to: string },
  locationId?: string
) {
  try {
    let query = supabase
      .from('consumptions')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    if (dateRange) {
      query = query
        .gte('date', dateRange.from)
        .lte('date', dateRange.to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Consumption Storage] Error fetching consumption:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[Consumption Storage] Error in getClientConsumption:', error);
    throw error;
  }
}

/**
 * Updates existing consumption record (for same day updates)
 */
export async function updateConsumptionRecord(
  consumptionId: string,
  salesData: TupaSalesData[]
): Promise<{ success: boolean; errors?: string[] }> {
  try {
    // Get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('consumptions')
      .select('*')
      .eq('id', consumptionId)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        errors: ['Consumption record not found']
      };
    }

    // Validate new sales data
    const validation = validateSalesData(salesData);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // Re-aggregate with new data
    const updated = aggregateConsumptionData(
      existing.client_id,
      salesData,
      existing.location_id
    );

    // Update record
    const { error: updateError } = await supabase
      .from('consumptions')
      .update({
        ...updated,
        updated_at: new Date().toISOString()
      })
      .eq('id', consumptionId);

    if (updateError) {
      return {
        success: false,
        errors: [`Update failed: ${updateError.message}`]
      };
    }

    console.log(`[Consumption Storage] Successfully updated consumption record ${consumptionId}`);
    return { success: true };

  } catch (error) {
    console.error('[Consumption Storage] Error updating consumption:', error);
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown update error']
    };
  }
}