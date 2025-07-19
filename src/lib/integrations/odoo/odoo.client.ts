export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  password: string;
  timeout: number;
}

export interface OdooAuthResult {
  uid: number;
  session_id: string;
  user_context: any;
}

export class OdooClient {
  private config: OdooConfig;
  private sessionId?: string;
  private uid?: number;

  constructor(config: OdooConfig) {
    this.config = config;
  }

  async authenticate(): Promise<boolean> {
    try {
      const response = await this.jsonRpcCall('/web/session/authenticate', {
        db: this.config.database,
        login: this.config.username,
        password: this.config.password
      });

      if (response.result?.uid) {
        this.uid = response.result.uid;
        this.sessionId = response.result.session_id;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Odoo authentication failed:', error);
      return false;
    }
  }

  async jsonRpcCall(endpoint: string, params: any): Promise<any> {
    const requestBody = {
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: Math.floor(Math.random() * 1000000)
    };

    const response = await fetch(`${this.config.url}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.sessionId ? `session_id=${this.sessionId}` : ''
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Odoo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Odoo RPC error: ${data.error.message}`);
    }

    return data;
  }

  async call(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    if (!this.uid) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Odoo');
      }
    }

    return this.jsonRpcCall('/web/dataset/call_kw', {
      model,
      method,
      args,
      kwargs: {
        context: { lang: 'es_AR', tz: 'America/Argentina/Buenos_Aires' },
        ...kwargs
      }
    });
  }

  async create(model: string, values: any): Promise<number> {
    const response = await this.call(model, 'create', [values]);
    return response.result;
  }

  async write(model: string, ids: number[], values: any): Promise<boolean> {
    const response = await this.call(model, 'write', [ids, values]);
    return response.result;
  }

  async search(model: string, domain: any[] = [], options: any = {}): Promise<number[]> {
    const response = await this.call(model, 'search', [domain], options);
    return response.result;
  }

  async read(model: string, ids: number[], fields: string[] = []): Promise<any[]> {
    const response = await this.call(model, 'read', [ids, fields]);
    return response.result;
  }

  getConfig(): OdooConfig {
    return this.config;
  }
}