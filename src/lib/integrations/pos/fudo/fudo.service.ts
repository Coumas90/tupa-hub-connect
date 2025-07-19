import { FudoClient } from './fudo.client';
import type { FudoApiResponse, FudoRawSale } from './fudo.types';

export class FudoService {
  private client: FudoClient;

  constructor(client: FudoClient) {
    this.client = client;
  }

  async fetchSales(dateFrom: string, dateTo: string): Promise<FudoRawSale[]> {
    try {
      const endpoint = `/sales?from=${dateFrom}&to=${dateTo}&store_id=${this.client.getStoreId()}`;
      const response: FudoApiResponse = await this.client.request(endpoint);
      
      return response.sales || [];
    } catch (error) {
      console.error('Error fetching Fudo sales:', error);
      throw new Error(`Failed to fetch sales from Fudo: ${error}`);
    }
  }

  async fetchSalesByIds(saleIds: string[]): Promise<FudoRawSale[]> {
    try {
      const endpoint = `/sales/batch`;
      const response: FudoApiResponse = await this.client.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({ sale_ids: saleIds }),
      });
      
      return response.sales || [];
    } catch (error) {
      console.error('Error fetching Fudo sales by IDs:', error);
      throw new Error(`Failed to fetch sales by IDs from Fudo: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.client.authenticate();
    } catch (error) {
      console.error('Fudo connection test failed:', error);
      return false;
    }
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      const response = await this.client.request('/sync/last-timestamp');
      return response.timestamp || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }
}