import { BistrosoftClient } from './bistrosoft.client';
import { BistrosoftService } from './bistrosoft.service';
import { BistrosoftMapper } from './bistrosoft.mapper';
import type { TupaSalesData } from '../pos.registry';
import type { BistrosoftConfig } from './bistrosoft.types';

export class BistrosoftAdapter {
  name = 'Bistrosoft POS';
  version = 'v1.0.0';
  
  private service: BistrosoftService;

  constructor(config: BistrosoftConfig) {
    const client = new BistrosoftClient(config);
    this.service = new BistrosoftService(client);
  }

  async fetchSales(clientId: string, dateRange: { from: string; to: string }): Promise<TupaSalesData[]> {
    try {
      const rawSales = await this.service.fetchSales(dateRange.from, dateRange.to);
      return BistrosoftMapper.mapToTupa(rawSales);
    } catch (error) {
      console.error(`Bistrosoft fetchSales failed for client ${clientId}:`, error);
      throw error;
    }
  }

  mapToTupa(rawData: any): TupaSalesData[] {
    if (!BistrosoftMapper.validateBistrosoftData(rawData.ventas)) {
      throw new Error('Invalid Bistrosoft data format');
    }
    
    return BistrosoftMapper.mapToTupa(rawData.ventas);
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
      'customer_data',
      'table_service',
      'discount_handling',
      'waiter_tracking'
    ];
  }
}