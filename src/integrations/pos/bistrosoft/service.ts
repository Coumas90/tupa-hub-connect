import { BistrosoftClient } from './client';
import { mapBistrosoftToTupa, validateBistrosoftData } from './mapper';
import { BistrosoftConfig, TupaSalesData } from './types';

export class BistrosoftService {
  private client: BistrosoftClient;
  
  constructor(config: BistrosoftConfig) {
    this.client = new BistrosoftClient(config);
  }

  /**
   * Fetches and maps sales data from Bistrosoft POS
   */
  async fetchSales(clientId: string, dateRange: { from: string; to: string }): Promise<TupaSalesData[]> {
    try {
      console.log(`[Bistrosoft Service] Fetching sales for client ${clientId}, range: ${dateRange.from} to ${dateRange.to}`);
      
      // Validate date range
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date range provided');
      }

      // Check if date range is reasonable (limit to 30 days for performance)
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        throw new Error('Date range cannot exceed 30 days. Please use smaller date ranges.');
      }

      // Fetch raw sales with pagination support
      const rawSales = await this.client.fetchSales(dateRange);
      
      console.log(`[Bistrosoft Service] Retrieved ${rawSales.length} raw sales records`);
      
      if (!validateBistrosoftData(rawSales)) {
        throw new Error('Invalid Bistrosoft data structure received from API');
      }

      // Transform to standardized format
      const mappedSales = mapBistrosoftToTupa(rawSales);
      
      // Validate mapped data integrity
      const validSales = mappedSales.filter(sale => {
        const isValid = this.validateTupaSale(sale);
        if (!isValid) {
          console.warn(`[Bistrosoft Service] Invalid sale data for transaction ${sale.pos_transaction_id}`);
        }
        return isValid;
      });
      
      console.log(`[Bistrosoft Service] Successfully mapped ${validSales.length} valid sales to Tupa format`);
      return validSales;
    } catch (error) {
      console.error(`[Bistrosoft Service] Error fetching sales:`, error);
      throw error;
    }
  }

  /**
   * Maps raw Bistrosoft data to Tupa format with enhanced validation
   */
  mapToTupa(rawData: any): TupaSalesData[] {
    try {
      if (!rawData) {
        throw new Error('No data provided for mapping');
      }

      // Handle different data structures from Bistrosoft API
      const salesArray = Array.isArray(rawData) ? rawData : 
                        rawData.tickets || rawData.sales || rawData.data || [];
      
      if (!validateBistrosoftData(salesArray)) {
        throw new Error('Invalid Bistrosoft data structure for mapping');
      }
      
      const mapped = mapBistrosoftToTupa(salesArray);
      
      // Post-mapping validation and filtering
      const validSales = mapped.filter(sale => {
        const isValid = this.validateTupaSale(sale);
        if (!isValid) {
          console.warn(`[Bistrosoft Service] Filtered invalid sale: ${sale.id}`);
        }
        return isValid;
      });
      
      console.log(`[Bistrosoft Service] Mapped ${salesArray.length} raw sales to ${validSales.length} valid Tupa sales`);
      return validSales;
    } catch (error) {
      console.error(`[Bistrosoft Service] Error mapping data:`, error);
      throw error;
    }
  }

  /**
   * Validates connection to Bistrosoft POS
   */
  async validateConnection(): Promise<boolean> {
    try {
      return await this.client.validateConnection();
    } catch (error) {
      console.error(`[Bistrosoft Service] Connection validation failed:`, error);
      return false;
    }
  }

  /**
   * Gets the last sync timestamp
   */
  async getLastSync(): Promise<string | null> {
    try {
      return await this.client.getLastSync();
    } catch (error) {
      console.error(`[Bistrosoft Service] Error getting last sync:`, error);
      return null;
    }
  }

  /**
   * Gets supported features for this POS integration
   */
  getSupportedFeatures(): string[] {
    return this.client.getSupportedFeatures();
  }

  /**
   * Gets integration metadata
   */
  getMetadata() {
    return {
      name: 'Bistrosoft POS',
      version: '1.0.0',
      provider: 'bistrosoft',
      features: this.getSupportedFeatures(),
      dataFormat: 'json',
      realTimeSupported: false,
      batchSizeLimit: 500,
      paginationSupported: true
    };
  }

  /**
   * Validates a Tupa sale record
   */
  private validateTupaSale(sale: TupaSalesData): boolean {
    try {
      // Required fields validation
      if (!sale.id || !sale.timestamp || !sale.pos_transaction_id) {
        return false;
      }

      // Amount validation
      if (typeof sale.amount !== 'number' || sale.amount < 0) {
        return false;
      }

      // Items validation
      if (!Array.isArray(sale.items) || sale.items.length === 0) {
        return false;
      }

      // Validate each item
      for (const item of sale.items) {
        if (!item.name || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
          return false;
        }
        if (item.quantity <= 0 || item.price < 0) {
          return false;
        }
      }

      // Timestamp validation
      const timestamp = new Date(sale.timestamp);
      if (isNaN(timestamp.getTime())) {
        return false;
      }

      // Payment method validation
      if (!sale.payment_method || typeof sale.payment_method !== 'string') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Bistrosoft Service] Sale validation error:', error);
      return false;
    }
  }
}