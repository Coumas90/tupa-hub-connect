export interface FudoRawSale {
  id: string;
  created_at: string;
  total: number;
  items: FudoRawItem[];
  customer?: FudoRawCustomer;
  payment_method: string;
  transaction_id: string;
  table_number?: string;
  waiter_id?: string;
}

export interface FudoRawItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  modifiers?: Array<{
    name: string;
    price: number;
  }>;
}

export interface FudoRawCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface FudoApiResponse {
  sales: FudoRawSale[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
  status: string;
}

export interface FudoConfig {
  baseUrl: string;
  apiKey: string;
  storeId: string;
  timeout: number;
}