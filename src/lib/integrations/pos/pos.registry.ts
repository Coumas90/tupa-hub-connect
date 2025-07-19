import { FudoAdapter } from './fudo/fudo.adapter';
import { BistrosoftAdapter } from './bistrosoft/bistrosoft.adapter';

export interface POSAdapter {
  name: string;
  version: string;
  fetchSales: (clientId: string, dateRange: { from: string; to: string }) => Promise<TupaSalesData[]>;
  mapToTupa: (rawData: any) => TupaSalesData[];
  validateConnection: () => Promise<boolean>;
  getLastSync?: () => Promise<string | null>;
  getSupportedFeatures?: () => string[];
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
    sku?: string;
    modifiers?: Array<{
      name: string;
      price: number;
    }>;
    notes?: string;
  }>;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
  };
  payment_method: string;
  pos_transaction_id: string;
  metadata?: {
    table_number?: string | number;
    waiter_id?: string;
    mesa?: number;
    mozo?: string;
    descuentos?: number;
    pos_provider: string;
  };
}

// Factory functions para crear adaptadores con configuración
export const createFudoAdapter = (config: any) => new FudoAdapter(config);
export const createBistrosoftAdapter = (config: any) => new BistrosoftAdapter(config);

// Registro centralizado de adaptadores POS disponibles
export const posRegistry: Record<string, { 
  adapter: any; // Será el constructor del adapter
  createAdapter: (config: any) => POSAdapter;
  version: string;
  features: string[];
}> = {
  'fudo': {
    adapter: FudoAdapter,
    createAdapter: createFudoAdapter,
    version: 'v1.0.0',
    features: ['sales_sync', 'real_time_updates', 'customer_data', 'item_modifiers', 'table_service']
  },
  'bistrosoft': {
    adapter: BistrosoftAdapter,
    createAdapter: createBistrosoftAdapter,
    version: 'v1.0.0',
    features: ['sales_sync', 'customer_data', 'table_service', 'discount_handling', 'waiter_tracking']
  }
};

// Helper para obtener adaptador configurado
export function getPOSAdapter(posType: string, config: any): POSAdapter {
  const posConfig = posRegistry[posType];
  if (!posConfig) {
    throw new Error(`POS adapter not found for type: ${posType}`);
  }
  
  return posConfig.createAdapter(config);
}

// Helper para listar POS disponibles
export function getAvailablePOSTypes(): Array<{
  type: string;
  name: string;
  version: string;
  features: string[];
}> {
  return Object.entries(posRegistry).map(([type, config]) => ({
    type,
    name: config.adapter.name || type,
    version: config.version,
    features: config.features
  }));
}