export interface POSAdapter {
  name: string;
  version: string;
  mapToTupa: (rawData: any) => TupaSalesData[];
  validateConnection?: () => Promise<boolean>;
}

export interface TupaSalesData {
  id: string;
  timestamp: string;
  amount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
  };
  payment_method: string;
  pos_transaction_id: string;
}

// Registro de adaptadores POS disponibles
export const posRegistry: Record<string, { adapter: POSAdapter }> = {
  'fudo': {
    adapter: {
      name: 'Fudo POS',
      version: '1.0.0',
      mapToTupa: (rawData: any): TupaSalesData[] => {
        // Mapper específico para Fudo
        return rawData.sales?.map((sale: any) => ({
          id: sale.id || `fudo_${Date.now()}`,
          timestamp: sale.created_at || new Date().toISOString(),
          amount: parseFloat(sale.total || 0),
          items: sale.items?.map((item: any) => ({
            name: item.name || 'Unknown Item',
            quantity: parseInt(item.quantity || 1),
            price: parseFloat(item.price || 0),
            category: item.category
          })) || [],
          customer: sale.customer ? {
            id: sale.customer.id,
            name: sale.customer.name,
            email: sale.customer.email
          } : undefined,
          payment_method: sale.payment_method || 'cash',
          pos_transaction_id: sale.transaction_id || sale.id
        })) || [];
      }
    }
  },
  'simphony': {
    adapter: {
      name: 'Oracle Simphony',
      version: '1.0.0',
      mapToTupa: (rawData: any): TupaSalesData[] => {
        // Mapper específico para Simphony
        return rawData.transactions?.map((transaction: any) => ({
          id: transaction.check_id || `simphony_${Date.now()}`,
          timestamp: transaction.business_date || new Date().toISOString(),
          amount: parseFloat(transaction.total_amount || 0),
          items: transaction.menu_items?.map((item: any) => ({
            name: item.menu_item_name || 'Unknown Item',
            quantity: parseInt(item.quantity || 1),
            price: parseFloat(item.price || 0),
            category: item.menu_group
          })) || [],
          payment_method: transaction.tender_type || 'cash',
          pos_transaction_id: transaction.check_id
        })) || [];
      }
    }
  }
};