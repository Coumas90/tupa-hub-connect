// Bistrosoft POS Integration Types
export interface BistrosoftRawSale {
  ticket_id: string;
  timestamp: string;
  table_id: string;
  server_id: string;
  server_name: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_type: string;
  line_items: BistrosoftRawItem[];
  customer_info?: {
    customer_id?: string;
    name?: string;
    phone?: string;
    email?: string;
    tax_id?: string;
  };
}

export interface BistrosoftRawItem {
  item_id: string;
  item_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
  category_name: string;
  modifiers?: BistrosoftRawModifier[];
  special_instructions?: string;
}

export interface BistrosoftRawModifier {
  modifier_name: string;
  modifier_price: number;
}

export interface BistrosoftConfig {
  apiUrl: string;
  apiKey: string;
  storeId?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface BistrosoftApiResponse {
  success: boolean;
  data?: any; // Can be BistrosoftRawSale[], sync status, or health check
  error?: string;
  pagination?: {
    page: number;
    total_pages: number;
    total_records: number;
  };
}

// Standardized Tupa Sale format (same as Fudo)
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