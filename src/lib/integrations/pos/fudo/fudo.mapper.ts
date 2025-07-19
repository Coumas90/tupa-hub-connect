import type { FudoRawSale } from './fudo.types';
import type { TupaSalesData } from '../pos.registry';

export class FudoMapper {
  static mapToTupa(fudoSales: FudoRawSale[]): TupaSalesData[] {
    return fudoSales.map(sale => this.mapSingleSale(sale));
  }

  private static mapSingleSale(sale: FudoRawSale): TupaSalesData {
    return {
      id: sale.id,
      timestamp: sale.created_at,
      amount: sale.total,
      items: sale.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category || 'uncategorized',
        modifiers: item.modifiers?.map(mod => ({
          name: mod.name,
          price: mod.price
        }))
      })),
      customer: sale.customer ? {
        id: sale.customer.id,
        name: sale.customer.name,
        email: sale.customer.email,
        phone: sale.customer.phone
      } : undefined,
      payment_method: this.normalizePaymentMethod(sale.payment_method),
      pos_transaction_id: sale.transaction_id,
      metadata: {
        table_number: sale.table_number,
        waiter_id: sale.waiter_id,
        pos_provider: 'fudo'
      }
    };
  }

  private static normalizePaymentMethod(fudoMethod: string): string {
    const methodMap: Record<string, string> = {
      'cash': 'cash',
      'credit_card': 'credit_card',
      'debit_card': 'debit_card',
      'transfer': 'bank_transfer',
      'qr': 'digital_wallet',
      'mercadopago': 'digital_wallet'
    };

    return methodMap[fudoMethod.toLowerCase()] || 'other';
  }

  static validateFudoData(data: any): boolean {
    if (!data || !Array.isArray(data)) {
      return false;
    }

    return data.every(sale => 
      sale.id && 
      sale.created_at && 
      typeof sale.total === 'number' &&
      Array.isArray(sale.items)
    );
  }
}