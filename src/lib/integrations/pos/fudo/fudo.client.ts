import type { FudoConfig } from './fudo.types';

export class FudoClient {
  private config: FudoConfig;

  constructor(config: FudoConfig) {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      return response.ok;
    } catch (error) {
      console.error('Fudo authentication failed:', error);
      return false;
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Store-ID': this.config.storeId,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Fudo API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  getStoreId(): string {
    return this.config.storeId;
  }
}