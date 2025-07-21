import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface OdooAuthResponse {
  uid: number;
  session_id: string;
  context: Record<string, any>;
}

export interface OdooCreateResponse {
  id: number;
  success: boolean;
}

export interface OdooSearchResponse {
  records: any[];
  length: number;
}

/**
 * Odoo XML-RPC and JSON-RPC Client
 */
export class OdooClient {
  private config: OdooConfig;
  private httpClient: AxiosInstance;
  private sessionId?: string;
  private uid?: number;
  private isAuthenticated: boolean = false;

  constructor(config: OdooConfig) {
    this.config = {
      ...config,
      timeout: config.timeout || 30000
    };

    this.httpClient = axios.create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`[OdooClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[OdooClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[OdooClient] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with Odoo server
   */
  async authenticate(): Promise<OdooAuthResponse> {
    try {
      console.log(`[OdooClient] Authenticating with ${this.config.url}`);

      const response: AxiosResponse = await this.httpClient.post('/web/session/authenticate', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: this.config.database,
          login: this.config.username,
          password: this.config.password,
          context: {}
        },
        id: Math.floor(Math.random() * 1000000)
      });

      if (response.data.error) {
        throw new Error(`Authentication failed: ${response.data.error.message}`);
      }

      const result = response.data.result;
      if (!result || !result.uid) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      this.uid = result.uid;
      this.sessionId = result.session_id;
      this.isAuthenticated = true;

      // Set session cookie for subsequent requests
      if (this.sessionId) {
        this.httpClient.defaults.headers.common['Cookie'] = `session_id=${this.sessionId}`;
      }

      console.log(`[OdooClient] Successfully authenticated as user ${this.uid}`);
      
      return {
        uid: this.uid,
        session_id: this.sessionId || '',
        context: result.context || {}
      };

    } catch (error) {
      this.isAuthenticated = false;
      console.error('[OdooClient] Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Validates connection to Odoo server
   */
  async validateConnection(): Promise<boolean> {
    try {
      if (!this.isAuthenticated) {
        await this.authenticate();
      }

      // Test connection by fetching server version
      const response = await this.httpClient.post('/web/webclient/version_info', {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Math.floor(Math.random() * 1000000)
      });

      return !response.data.error && response.data.result;
    } catch (error) {
      console.error('[OdooClient] Connection validation failed:', error);
      return false;
    }
  }

  /**
   * Execute Odoo ORM method
   */
  async executeKw(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    try {
      const response = await this.httpClient.post('/web/dataset/call_kw', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model,
          method,
          args,
          kwargs: {
            context: {},
            ...kwargs
          }
        },
        id: Math.floor(Math.random() * 1000000)
      });

      if (response.data.error) {
        throw new Error(`Odoo RPC Error: ${response.data.error.message || 'Unknown error'}`);
      }

      return response.data.result;
    } catch (error) {
      console.error(`[OdooClient] executeKw failed for ${model}.${method}:`, error);
      throw error;
    }
  }

  /**
   * Search records in Odoo
   */
  async search(
    model: string,
    domain: any[] = [],
    options: {
      offset?: number;
      limit?: number;
      order?: string;
      context?: Record<string, any>;
    } = {}
  ): Promise<number[]> {
    return await this.executeKw(model, 'search', [domain], options);
  }

  /**
   * Read records from Odoo
   */
  async read(
    model: string,
    ids: number[],
    fields: string[] = [],
    context: Record<string, any> = {}
  ): Promise<any[]> {
    return await this.executeKw(model, 'read', [ids, fields], { context });
  }

  /**
   * Search and read records in one call
   */
  async searchRead(
    model: string,
    domain: any[] = [],
    fields: string[] = [],
    options: {
      offset?: number;
      limit?: number;
      order?: string;
      context?: Record<string, any>;
    } = {}
  ): Promise<any[]> {
    return await this.executeKw(model, 'search_read', [domain, fields], options);
  }

  /**
   * Create a new record in Odoo
   */
  async create(
    model: string,
    values: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<number> {
    return await this.executeKw(model, 'create', [values], { context });
  }

  /**
   * Update records in Odoo
   */
  async write(
    model: string,
    ids: number[],
    values: Record<string, any>,
    context: Record<string, any> = {}
  ): Promise<boolean> {
    return await this.executeKw(model, 'write', [ids, values], { context });
  }

  /**
   * Delete records from Odoo
   */
  async unlink(
    model: string,
    ids: number[],
    context: Record<string, any> = {}
  ): Promise<boolean> {
    return await this.executeKw(model, 'unlink', [ids], { context });
  }

  /**
   * Get record count
   */
  async searchCount(
    model: string,
    domain: any[] = [],
    context: Record<string, any> = {}
  ): Promise<number> {
    return await this.executeKw(model, 'search_count', [domain], { context });
  }

  /**
   * Check if record exists
   */
  async exists(
    model: string,
    domain: any[],
    context: Record<string, any> = {}
  ): Promise<boolean> {
    const count = await this.searchCount(model, domain, context);
    return count > 0;
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<any> {
    try {
      const response = await this.httpClient.post('/web/webclient/version_info', {
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Math.floor(Math.random() * 1000000)
      });

      return response.data.result;
    } catch (error) {
      console.error('[OdooClient] Failed to get server info:', error);
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getUserInfo(): Promise<any> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    return await this.read('res.users', [this.uid!], [
      'name', 'login', 'email', 'company_id', 'groups_id'
    ]);
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.sessionId) {
        await this.httpClient.post('/web/session/destroy', {
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: Math.floor(Math.random() * 1000000)
        });
      }
    } catch (error) {
      console.error('[OdooClient] Logout error:', error);
    } finally {
      this.isAuthenticated = false;
      this.uid = undefined;
      this.sessionId = undefined;
      delete this.httpClient.defaults.headers.common['Cookie'];
    }
  }

  /**
   * Get authentication status
   */
  getAuthStatus(): { isAuthenticated: boolean; uid?: number; sessionId?: string } {
    return {
      isAuthenticated: this.isAuthenticated,
      uid: this.uid,
      sessionId: this.sessionId
    };
  }
}