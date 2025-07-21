// Fudo POS Integration Types
export interface FudoRawSale {
  id: string;
  fecha: string;
  hora: string;
  mesa: number;
  mozo: string;
  items: FudoRawItem[];
  total: number;
  descuentos: number;
  metodo_pago: string;
  cliente?: {
    nombre?: string;
    telefono?: string;
    email?: string;
    documento?: string;
  };
}

export interface FudoRawItem {
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  categoria: string;
  modificadores?: FudoRawModifier[];
  observaciones?: string;
}

export interface FudoRawModifier {
  nombre: string;
  precio: number;
}

export interface FudoConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface FudoApiResponse {
  success: boolean;
  data?: any; // Can be FudoRawSale[], sync status, or health check
  error?: string;
  timestamp: string;
}

// Standardized Tupa Sale format
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