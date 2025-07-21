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
      
      const rawSales = await this.client.fetchSales(dateRange);
      
      if (!validateFudoData(rawSales)) {
        throw new Error('Invalid Fudo data structure received');
      }

      const mappedSales = mapFudoToTupa(rawSales);
      
      console.log(`[Fudo Service] Successfully mapped ${mappedSales.length} sales`);
      return mappedSales;
    } catch (error) {
      console.error(`[Fudo Service] Error fetching sales:`, error);
      throw error;
    }
  }

  /**
   * Maps raw Fudo data to Tupa format
   */
  mapToTupa(rawData: any): TupaSalesData[] {
    try {
      if (!validateFudoData(rawData)) {
        throw new Error('Invalid Fudo data structure for mapping');
      }
      
      return mapFudoToTupa(rawData);
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
}