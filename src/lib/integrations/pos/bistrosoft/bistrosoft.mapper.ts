import type { BistrosoftRawSale } from './bistrosoft.types';
import type { TupaSalesData } from '../pos.registry';

export class BistrosoftMapper {
  static mapToTupa(bistrosoftSales: BistrosoftRawSale[]): TupaSalesData[] {
    return bistrosoftSales.map(sale => this.mapSingleSale(sale));
  }

  private static mapSingleSale(sale: BistrosoftRawSale): TupaSalesData {
    return {
      id: sale.venta_id,
      timestamp: sale.fecha_hora,
      amount: sale.total_venta - (sale.descuentos || 0),
      items: sale.productos.map(producto => ({
        name: producto.nombre,
        quantity: producto.cantidad,
        price: producto.precio_unitario,
        category: producto.categoria || 'sin_categoria',
        sku: producto.codigo,
        notes: producto.observaciones
      })),
      customer: sale.cliente ? {
        id: sale.cliente.cliente_id,
        name: sale.cliente.nombre,
        email: sale.cliente.email,
        phone: sale.cliente.telefono,
        document: sale.cliente.documento
      } : undefined,
      payment_method: this.normalizePaymentMethod(sale.forma_pago),
      pos_transaction_id: sale.numero_ticket,
      metadata: {
        mesa: sale.mesa,
        mozo: sale.mozo,
        descuentos: sale.descuentos,
        pos_provider: 'bistrosoft'
      }
    };
  }

  private static normalizePaymentMethod(bistrosoftMethod: string): string {
    const methodMap: Record<string, string> = {
      'efectivo': 'cash',
      'tarjeta_credito': 'credit_card',
      'tarjeta_debito': 'debit_card',
      'transferencia': 'bank_transfer',
      'mercadopago': 'digital_wallet',
      'billetera_digital': 'digital_wallet',
      'cheque': 'check'
    };

    return methodMap[bistrosoftMethod.toLowerCase()] || 'other';
  }

  static validateBistrosoftData(data: any): boolean {
    if (!data || !Array.isArray(data)) {
      return false;
    }

    return data.every(sale => 
      sale.venta_id && 
      sale.fecha_hora && 
      typeof sale.total_venta === 'number' &&
      Array.isArray(sale.productos)
    );
  }
}