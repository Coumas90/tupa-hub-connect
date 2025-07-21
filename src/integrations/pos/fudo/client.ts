import { FudoConfig, FudoApiResponse, FudoRawSale } from './types';

export class FudoClient {
  private config: FudoConfig;

  constructor(config: FudoConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Validates connection to Fudo POS API
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/health');
      return response.success;
    } catch (error) {
      console.error('Fudo connection validation failed:', error);
      return false;
    }
  }

  /**
   * Fetches sales data from Fudo POS for a given date range
   */
  async fetchSales(dateRange: { from: string; to: string }): Promise<FudoRawSale[]> {
    try {
      const response = await this.makeRequest('/api/ventas', {
        fecha_desde: dateRange.from,
        fecha_hasta: dateRange.to
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch sales data');
      }

      return response.data || [];
    } catch (error) {
      console.error('Error fetching Fudo sales:', error);
      throw error;
    }
  }

  /**
   * Gets the timestamp of the last successful sync
   */
  async getLastSync(): Promise<string | null> {
    try {
      const response = await this.makeRequest('/api/sync/last');
      return response.data?.last_sync_timestamp || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Makes authenticated HTTP request to Fudo API
   */
  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<FudoApiResponse> {
    const url = new URL(endpoint, this.config.apiUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value.toString());
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'TupaHub-Integration/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.ventas || data.data || data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  /**
   * Gets supported features for this POS integration
   */
  getSupportedFeatures(): string[] {
    return [
      'sales_sync',
      'real_time_updates', 
      'customer_data',
      'item_modifiers',
      'table_service',
      'waiter_tracking',
      'discount_handling'
    ];
  }
}