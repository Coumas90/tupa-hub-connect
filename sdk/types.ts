/**
 * Core types for TUPÁ Hub SDK
 */

export interface TupaConfig {
  /** API Key for authentication */
  apiKey: string;
  /** Base endpoint URL */
  endpoint: string;
  /** API version */
  version?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface SalePayload {
  /** Unique sale identifier */
  id: string;
  /** Total sale amount */
  total: number;
  /** Sale date in ISO format */
  date: string;
  /** Client identifier */
  clientId?: string;
  /** Sale items */
  items: SaleItem[];
  /** Payment method */
  paymentMethod?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface SaleItem {
  /** Item identifier */
  id: string;
  /** Item name */
  name: string;
  /** Quantity sold */
  quantity: number;
  /** Unit price */
  price: number;
  /** Item category */
  category?: string;
  /** SKU or product code */
  sku?: string;
}

export interface ClientPayload {
  /** Client unique identifier */
  id: string;
  /** Client name */
  name: string;
  /** Client email */
  email?: string;
  /** Client phone */
  phone?: string;
  /** Client address */
  address?: string;
  /** Client type (individual, business) */
  type?: 'individual' | 'business';
  /** Additional client metadata */
  metadata?: Record<string, any>;
}

export interface Product {
  /** Product identifier */
  id: string;
  /** Product name */
  name: string;
  /** Product description */
  description?: string;
  /** Product price */
  price: number;
  /** Product category */
  category?: string;
  /** SKU or product code */
  sku?: string;
  /** Stock quantity */
  stock?: number;
  /** Product status */
  active: boolean;
}

export interface TupaResponse<T = any> {
  /** Response data */
  data: T;
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
  /** Request timestamp */
  timestamp: string;
}

export interface TupaError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: Record<string, any>;
}