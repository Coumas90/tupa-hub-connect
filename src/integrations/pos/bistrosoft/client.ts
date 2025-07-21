import { BistrosoftConfig, BistrosoftApiResponse, BistrosoftRawSale } from './types';

export class BistrosoftClient {
  private config: BistrosoftConfig;

  constructor(config: BistrosoftConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      ...config
    };
  }

  /**
   * Validates connection to Bistrosoft POS API
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/ping');
      return response.success;
    } catch (error) {
      console.error('Bistrosoft connection validation failed:', error);
      return false;
    }
  }

  /**
   * Fetches sales data from Bistrosoft POS for a given date range
   */
  async fetchSales(dateRange: { from: string; to: string }): Promise<BistrosoftRawSale[]> {
    try {
      const allSales: BistrosoftRawSale[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await this.makeRequest('/tickets', {
          from_date: dateRange.from,
          to_date: dateRange.to,
          page,
          per_page: 100
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch sales data');
        }

        const sales = response.data || [];
        allSales.push(...sales);

        // Check if there are more pages
        hasMore = response.pagination ? page < response.pagination.total_pages : false;
        page++;
      }

      return allSales;
    } catch (error) {
      console.error('Error fetching Bistrosoft sales:', error);
      throw error;
    }
  }

  /**
   * Gets the timestamp of the last successful sync
   */
  async getLastSync(): Promise<string | null> {
    try {
      const response = await this.makeRequest('/sync/status');
      return response.data?.last_sync_timestamp || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Makes authenticated HTTP request to Bistrosoft API
   */
  private async makeRequest(endpoint: string, params?: Record<string, any>): Promise<BistrosoftApiResponse> {
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
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'TupaHub-Integration/1.0',
          ...(this.config.storeId && { 'X-Store-ID': this.config.storeId })
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
        data: data.tickets || data.data || data,
        pagination: data.pagination,
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
      'customer_data',
      'table_service', 
      'discount_handling',
      'waiter_tracking',
      'tax_reporting',
      'pagination_support'
    ];
  }
}