import { TupaHubClient } from '../tupahub.client';
import { SalePayload, SaleItem } from '../types';
import { createLogger } from '../utils/logger';

/**
 * Fudo POS adapter for TUPÁ Hub SDK
 * Example implementation for integrating with Fudo POS system
 */
export class FudoAdapter {
  private client: TupaHubClient;
  private logger: ReturnType<typeof createLogger>;

  constructor(client: TupaHubClient) {
    this.client = client;
    this.logger = createLogger('FudoAdapter');
  }

  /**
   * Transform Fudo sale data to TUPÁ format
   * @param fudoSale Raw sale data from Fudo POS
   * @returns Transformed sale payload
   */
  transformSale(fudoSale: FudoSaleData): SalePayload {
    this.logger.debug('Transforming Fudo sale', { saleId: fudoSale.id });

    const salePayload: SalePayload = {
      id: fudoSale.id,
      total: fudoSale.total,
      date: fudoSale.timestamp || new Date().toISOString(),
      clientId: fudoSale.customer_id,
      items: fudoSale.items?.map(this.transformSaleItem) || [],
      paymentMethod: fudoSale.payment_method,
      metadata: {
        source: 'fudo',
        originalData: fudoSale,
        location: fudoSale.location,
        cashier: fudoSale.cashier_id
      }
    };

    return salePayload;
  }

  /**
   * Transform Fudo sale item to TUPÁ format
   * @param fudoItem Raw item data from Fudo
   * @returns Transformed sale item
   */
  private transformSaleItem(fudoItem: FudoItemData): SaleItem {
    return {
      id: fudoItem.product_id,
      name: fudoItem.product_name,
      quantity: fudoItem.quantity,
      price: fudoItem.unit_price,
      category: fudoItem.category,
      sku: fudoItem.sku || fudoItem.product_id
    };
  }

  /**
   * Sync Fudo sale to TUPÁ Hub
   * @param fudoSale Fudo sale data
   * @returns Promise with sync result
   */
  async syncSale(fudoSale: FudoSaleData) {
    try {
      const tupaPayload = this.transformSale(fudoSale);
      const result = await this.client.createSale(tupaPayload);
      
      this.logger.info('Sale synced successfully', { 
        saleId: fudoSale.id,
        tupaId: result.data.id 
      });
      
      return result;
    } catch (error) {
      this.logger.error('Failed to sync sale', { 
        saleId: fudoSale.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Batch sync multiple Fudo sales
   * @param fudoSales Array of Fudo sales
   * @returns Promise with batch sync results
   */
  async batchSyncSales(fudoSales: FudoSaleData[]) {
    this.logger.info('Starting batch sync', { count: fudoSales.length });
    
    const results = [];
    const errors = [];

    for (const sale of fudoSales) {
      try {
        const result = await this.syncSale(sale);
        results.push({ saleId: sale.id, success: true, data: result });
      } catch (error) {
        errors.push({ 
          saleId: sale.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    this.logger.info('Batch sync completed', { 
      total: fudoSales.length,
      successful: results.length,
      failed: errors.length
    });

    return { results, errors };
  }
}

/**
 * Fudo POS data structures
 */
export interface FudoSaleData {
  id: string;
  total: number;
  timestamp?: string;
  customer_id?: string;
  payment_method?: string;
  location?: string;
  cashier_id?: string;
  items?: FudoItemData[];
}

export interface FudoItemData {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  category?: string;
  sku?: string;
}