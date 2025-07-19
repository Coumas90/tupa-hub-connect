import type { BistrosoftConfig } from './bistrosoft.types';

export class BistrosoftClient {
  private config: BistrosoftConfig;
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(config: BistrosoftConfig) {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: this.config.usuario,
          password: this.config.password,
          empresa_id: this.config.empresaId
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      
      return true;
    } catch (error) {
      console.error('Bistrosoft authentication failed:', error);
      return false;
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Check if token is valid
    if (!this.authToken || (this.tokenExpiry && this.tokenExpiry < new Date())) {
      await this.authenticate();
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'X-Empresa-ID': this.config.empresaId,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Bistrosoft API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  getEmpresaId(): string {
    return this.config.empresaId;
  }
}