import { FudoRawSale, TupaSalesData } from './types';

/**
 * Maps Fudo POS raw data to standardized Tupa format
 */
export function mapFudoToTupa(fudoSales: FudoRawSale[]): TupaSalesData[] {
  return fudoSales.map((sale, index) => {
    try {
      // Normalize timestamp
      const timestamp = normalizeFudoTimestamp(sale.fecha, sale.hora);
      
      // Map items with validation
      const items = sale.items.map(item => {
        // Calculate unit price if not provided correctly
        const unitPrice = item.cantidad > 0 ? item.precio_total / item.cantidad : item.precio_unitario;
        
        return {
          name: item.nombre || `Item ${item.codigo}`,
          quantity: Math.max(1, item.cantidad || 1),
          price: Math.max(0, item.precio_total || 0),
          category: item.categoria || 'General',
          sku: item.codigo || `fudo-${sale.id}-${index}`,
          modifiers: item.modificadores?.map(mod => ({
            name: mod.nombre || 'Modifier',
            price: Math.max(0, mod.precio || 0)
          })) || [],
          notes: item.observaciones || undefined
        };
      });

      // Calculate totals for validation
      const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
      const finalAmount = Math.max(0, sale.total || itemsTotal);

      return {
        id: sale.id || `fudo-${Date.now()}-${index}`,
        timestamp,
        amount: finalAmount,
        items,
        customer: sale.cliente ? {
          name: sale.cliente.nombre || undefined,
          email: sale.cliente.email || undefined,
          phone: sale.cliente.telefono || undefined,
          document: sale.cliente.documento || undefined
        } : undefined,
        payment_method: sale.metodo_pago || 'unknown',
        pos_transaction_id: sale.id || `fudo-${Date.now()}-${index}`,
        metadata: {
          table_number: sale.mesa || undefined,
          mesa: sale.mesa || undefined,
          mozo: sale.mozo || undefined,
          waiter_id: sale.mozo || undefined,
          descuentos: Math.max(0, sale.descuentos || 0),
          pos_provider: 'fudo',
          original_total: sale.total,
          items_total: itemsTotal
        }
      };
    } catch (error) {
      console.error(`Error mapping Fudo sale ${sale.id}:`, error);
      // Return a minimal valid structure for failed mappings
      return {
        id: sale.id || `fudo-error-${index}`,
        timestamp: new Date().toISOString(),
        amount: Math.max(0, sale.total || 0),
        items: [{
          name: 'Error - Could not map items',
          quantity: 1,
          price: Math.max(0, sale.total || 0),
          category: 'Error'
        }],
        payment_method: sale.metodo_pago || 'unknown',
        pos_transaction_id: sale.id || `fudo-error-${index}`,
        metadata: {
          pos_provider: 'fudo',
          mapping_error: true,
          error_message: error instanceof Error ? error.message : 'Unknown mapping error'
        }
      };
    }
  });
}

/**
 * Validates Fudo raw data structure
 */
export function validateFudoData(data: any): data is FudoRawSale[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(sale => (
    typeof sale === 'object' &&
    typeof sale.id === 'string' &&
    typeof sale.fecha === 'string' &&
    typeof sale.hora === 'string' &&
    typeof sale.total === 'number' &&
    Array.isArray(sale.items)
  ));
}

/**
 * Transforms Fudo timestamps to ISO format
 */
export function normalizeFudoTimestamp(fecha: string, hora: string): string {
  try {
    // Assume fecha is in DD/MM/YYYY format and hora is in HH:MM format
    const [day, month, year] = fecha.split('/');
    const [hours, minutes] = hora.split(':');
    
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1, // Month is 0-indexed
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );
    
    return date.toISOString();
  } catch (error) {
    console.error('Error normalizing Fudo timestamp:', error);
    return new Date().toISOString();
  }
}

/**
 * Calculates totals and validates data consistency
 */
export function validateFudoSaleIntegrity(sale: FudoRawSale): boolean {
  try {
    const calculatedTotal = sale.items.reduce((sum, item) => sum + item.precio_total, 0);
    const finalTotal = calculatedTotal - (sale.descuentos || 0);
    
    // Allow for small floating point differences
    const tolerance = 0.01;
    return Math.abs(finalTotal - sale.total) <= tolerance;
  } catch (error) {
    console.error('Error validating Fudo sale integrity:', error);
    return false;
  }
}