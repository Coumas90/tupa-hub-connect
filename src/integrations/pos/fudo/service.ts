import { FudoClient } from './client';
import { mapFudoToTupa, validateFudoData } from './mapper';
import { FudoConfig, TupaSalesData } from './types';

export class FudoService {
  private client: FudoClient;
  
  constructor(config: FudoConfig) {
    this.client = new FudoClient(config);
  }

  /**
   * Fetches and maps sales data from Fudo POS
   */
  async fetchSales(clientId: string, dateRange: { from: string; to: string }): Promise<TupaSalesData[]> {
    try {
      console.log(`[Fudo Service] Fetching sales for client ${clientId}, range: ${dateRange.from} to ${dateRange.to}`);
      
      // Validate date range
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        throw new Error('Invalid date range provided');
      }

      // Check if date range is too large (limit to 30 days)
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) {
        throw new Error('Date range cannot exceed 30 days');
      }

      // Fetch raw sales data from Fudo API
      const rawSales = await this.client.fetchSales(dateRange);
      
      console.log(`[Fudo Service] Retrieved ${rawSales.length} raw sales records`);
      
      if (!validateFudoData(rawSales)) {
        throw new Error('Invalid Fudo data structure received from API');
      }

      // Transform to standardized format
      const mappedSales = mapFudoToTupa(rawSales);
      
      // Validate mapped data integrity
      for (const sale of mappedSales) {
        if (!this.validateTupaSale(sale)) {
          console.warn(`[Fudo Service] Invalid sale data for transaction ${sale.pos_transaction_id}`);
        }
      }
      
      console.log(`[Fudo Service] Successfully mapped ${mappedSales.length} sales to Tupa format`);
      return mappedSales;
    } catch (error) {
      console.error(`[Fudo Service] Error fetching sales:`, error);
      throw error;
    }
  }

  /**
   * Maps raw Fudo data to Tupa format with enhanced validation
   */
  mapToTupa(rawData: any): TupaSalesData[] {
    try {
      if (!rawData) {
        throw new Error('No data provided for mapping');
      }

      // Handle both array and object with sales property
      const salesArray = Array.isArray(rawData) ? rawData : rawData.sales || rawData.ventas || [];
      
      if (!validateFudoData(salesArray)) {
        throw new Error('Invalid Fudo data structure for mapping');
      }
      
      const mapped = mapFudoToTupa(salesArray);
      
      // Post-mapping validation
      const validSales = mapped.filter(sale => {
        const isValid = this.validateTupaSale(sale);
        if (!isValid) {
          console.warn(`[Fudo Service] Filtered invalid sale: ${sale.id}`);
        }
        return isValid;
      });
      
      console.log(`[Fudo Service] Mapped ${salesArray.length} raw sales to ${validSales.length} valid Tupa sales`);
      return validSales;
    } catch (error) {
      console.error(`[Fudo Service] Error mapping data:`, error);
      throw error;
    }
  }

  /**
   * Validates connection to Fudo POS
   */
  async validateConnection(): Promise<boolean> {
    try {
      return await this.client.validateConnection();
    } catch (error) {
      console.error(`[Fudo Service] Connection validation failed:`, error);
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
      console.error(`[Fudo Service] Error getting last sync:`, error);
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
      name: 'Fudo POS',
      version: '1.0.0',
      provider: 'fudo',
      features: this.getSupportedFeatures(),
      dataFormat: 'json',
      realTimeSupported: true,
      batchSizeLimit: 1000
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
      console.error('[Fudo Service] Sale validation error:', error);
      return false;
    }
  }
}