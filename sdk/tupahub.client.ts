import { TupaConfig, SalePayload, ClientPayload, Product, TupaResponse } from './types';
import { TupaHubError } from './utils/errors';
import { createLogger } from './utils/logger';
import { 
  validateSalePayload, 
  validateClientPayload, 
  validateTupaConfig, 
  validateProductListParams,
  type ValidatedProductListParams 
} from './schemas';

/**
 * TUPÁ Hub SDK Client
 * Main client for interacting with TUPÁ Hub API
 */
export class TupaHubClient {
  private config: Required<TupaConfig>;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: TupaConfig) {
    // Validate config using Zod schema
    const validatedConfig = validateTupaConfig(config);
    
    this.config = {
      version: 'v1',
      timeout: 30000,
      maxRetries: 3,
      ...validatedConfig
    };
    
    this.logger = createLogger('TupaHubClient');
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new TupaHubError('API_KEY_REQUIRED', 'API Key is required for authentication');
    }
    if (!this.config.endpoint) {
      throw new TupaHubError('ENDPOINT_REQUIRED', 'Endpoint URL is required');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': `TupaHub-SDK/${this.config.version}`,
      'X-API-Version': this.config.version
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<TupaResponse<T>> {
    const url = `${this.config.endpoint.replace(/\/$/, '')}/${this.config.version}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.debug(`Request attempt ${attempt}/${this.config.maxRetries}`, { url, method: options.method });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options.headers
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new TupaHubError(
            errorData.code || 'HTTP_ERROR',
            errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status
          );
        }

        const data = await response.json();
        this.logger.debug('Request successful', { url, status: response.status });
        return data;

      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Request attempt ${attempt} failed`, { 
          url, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });

        if (attempt === this.config.maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new TupaHubError(
      'MAX_RETRIES_EXCEEDED',
      `Request failed after ${this.config.maxRetries} attempts: ${lastError.message}`
    );
  }

  /**
   * Create a new sale record
   * @param salePayload Sale data to create
   * @returns Promise with created sale response
   */
  async createSale(salePayload: SalePayload): Promise<TupaResponse<SalePayload>> {
    // Validate input using Zod schema
    const validatedPayload = validateSalePayload(salePayload);
    
    this.logger.info('Creating sale', { saleId: validatedPayload.id });
    return this.makeRequest<SalePayload>('/sales', {
      method: 'POST',
      body: JSON.stringify(validatedPayload)
    });
  }

  /**
   * Get client information by ID
   * @param clientId Client identifier
   * @returns Promise with client data
   */
  async getClient(clientId: string): Promise<TupaResponse<ClientPayload>> {
    this.logger.info('Fetching client', { clientId });
    return this.makeRequest<ClientPayload>(`/clients/${encodeURIComponent(clientId)}`);
  }

  /**
   * List all available products
   * @param params Optional query parameters
   * @returns Promise with products list
   */
  async listProducts(params?: ValidatedProductListParams): Promise<TupaResponse<Product[]>> {
    // Validate params if provided
    const validatedParams = params ? validateProductListParams(params) : undefined;
    
    this.logger.info('Listing products', { params: validatedParams });
    
    const queryString = validatedParams ? 
      '?' + new URLSearchParams(
        Object.entries(validatedParams)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => [key, String(value)])
      ).toString() : '';

    return this.makeRequest<Product[]>(`/products${queryString}`);
  }

  /**
   * Update client information
   * @param clientId Client identifier
   * @param clientData Updated client data
   * @returns Promise with updated client response
   */
  async updateClient(clientId: string, clientData: Partial<ClientPayload>): Promise<TupaResponse<ClientPayload>> {
    // Validate partial client data
    if (Object.keys(clientData).length === 0) {
      throw new TupaHubError('INVALID_INPUT', 'Client data cannot be empty');
    }
    
    this.logger.info('Updating client', { clientId });
    return this.makeRequest<ClientPayload>(`/clients/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  }

  /**
   * Get sale by ID
   * @param saleId Sale identifier
   * @returns Promise with sale data
   */
  async getSale(saleId: string): Promise<TupaResponse<SalePayload>> {
    this.logger.info('Fetching sale', { saleId });
    return this.makeRequest<SalePayload>(`/sales/${encodeURIComponent(saleId)}`);
  }

  /**
   * Health check endpoint
   * @returns Promise with health status
   */
  async healthCheck(): Promise<TupaResponse<{ status: string; timestamp: string }>> {
    this.logger.debug('Health check');
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }
}