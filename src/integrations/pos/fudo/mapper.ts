import { FudoRawSale, TupaSalesData } from './types';

/**
 * Maps Fudo POS raw data to standardized Tupa format
 */
export function mapFudoToTupa(fudoSales: FudoRawSale[]): TupaSalesData[] {
  return fudoSales.map(sale => ({
    id: sale.id,
    timestamp: `${sale.fecha}T${sale.hora}:00.000Z`,
    amount: sale.total,
    items: sale.items.map(item => ({
      name: item.nombre,
      quantity: item.cantidad,
      price: item.precio_total,
      category: item.categoria,
      sku: item.codigo,
      modifiers: item.modificadores?.map(mod => ({
        name: mod.nombre,
        price: mod.precio
      })) || [],
      notes: item.observaciones
    })),
    customer: sale.cliente ? {
      name: sale.cliente.nombre,
      email: sale.cliente.email,
      phone: sale.cliente.telefono,
      document: sale.cliente.documento
    } : undefined,
    payment_method: sale.metodo_pago,
    pos_transaction_id: sale.id,
    metadata: {
      table_number: sale.mesa,
      mesa: sale.mesa,
      mozo: sale.mozo,
      waiter_id: sale.mozo,
      descuentos: sale.descuentos,
      pos_provider: 'fudo'
    }
  }));
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