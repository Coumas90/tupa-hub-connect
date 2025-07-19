import { FudoClient } from './fudo.client';
import { FudoService } from './fudo.service';
import { FudoMapper } from './fudo.mapper';
import type { TupaSalesData } from '../pos.registry';
import type { FudoConfig } from './fudo.types';

export class FudoAdapter {
  name = 'Fudo POS';
  version = 'v1.0.0';
  
  private service: FudoService;

  constructor(config: FudoConfig) {
    const client = new FudoClient(config);
    this.service = new FudoService(client);
  }

  async fetchSales(clientId: string, dateRange: { from: string; to: string }): Promise<TupaSalesData[]> {
    try {
      const rawSales = await this.service.fetchSales(dateRange.from, dateRange.to);
      return FudoMapper.mapToTupa(rawSales);
    } catch (error) {
      console.error(`Fudo fetchSales failed for client ${clientId}:`, error);
      throw error;
    }
  }

  mapToTupa(rawData: any): TupaSalesData[] {
    if (!FudoMapper.validateFudoData(rawData.sales)) {
      throw new Error('Invalid Fudo data format');
    }
    
    return FudoMapper.mapToTupa(rawData.sales);
  }

  async validateConnection(): Promise<boolean> {
    return await this.service.testConnection();
  }

  async getLastSync(): Promise<string | null> {
    return await this.service.getLastSyncTimestamp();
  }

  getSupportedFeatures(): string[] {
    return [
      'sales_sync',
      'real_time_updates',
      'customer_data',
      'item_modifiers',
      'table_service'
    ];
  }
}