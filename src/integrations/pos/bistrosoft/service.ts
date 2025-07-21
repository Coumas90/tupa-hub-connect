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
      
      const rawSales = await this.client.fetchSales(dateRange);
      
      if (!validateBistrosoftData(rawSales)) {
        throw new Error('Invalid Bistrosoft data structure received');
      }

      const mappedSales = mapBistrosoftToTupa(rawSales);
      
      console.log(`[Bistrosoft Service] Successfully mapped ${mappedSales.length} sales`);
      return mappedSales;
    } catch (error) {
      console.error(`[Bistrosoft Service] Error fetching sales:`, error);
      throw error;
    }
  }

  /**
   * Maps raw Bistrosoft data to Tupa format
   */
  mapToTupa(rawData: any): TupaSalesData[] {
    try {
      if (!validateBistrosoftData(rawData)) {
        throw new Error('Invalid Bistrosoft data structure for mapping');
      }
      
      return mapBistrosoftToTupa(rawData);
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
}