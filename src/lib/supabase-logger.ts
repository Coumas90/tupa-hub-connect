import { logger, loggerUtils } from '@/lib/browser-logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced Supabase client with logging
 */
export class LoggedSupabaseClient {
  private client = supabase;

  /**
   * Execute a query with logging
   */
  async query<T = any>(
    operation: string,
    tableName: string,
    queryFn: () => any
  ): Promise<{ data: T | null; error: any }> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      if (result.error) {
        loggerUtils.logDatabase(operation, tableName, false, duration, new Error(result.error.message));
      } else {
        loggerUtils.logDatabase(operation, tableName, true, duration);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerUtils.logDatabase(operation, tableName, false, duration, error as Error);
      throw error;
    }
  }

  /**
   * Select with logging - uses the original client methods
   */
  async selectWithLogging<T = any>(tableName: string, query?: string) {
    return this.query<T[]>('SELECT', tableName, () => {
      const queryBuilder = this.client.from(tableName as any).select(query || '*');
      return queryBuilder;
    });
  }

  /**
   * Insert with logging - uses the original client methods
   */
  async insertWithLogging<T = any>(tableName: string, data: any) {
    return this.query<T>('INSERT', tableName, () => {
      return this.client.from(tableName as any).insert(data).select();
    });
  }

  /**
   * Update with logging - uses the original client methods
   */
  async updateWithLogging<T = any>(tableName: string, data: any, filter: any) {
    return this.query<T>('UPDATE', tableName, () => {
      return this.client.from(tableName as any).update(data).match(filter).select();
    });
  }

  /**
   * Delete with logging - uses the original client methods
   */
  async deleteWithLogging<T = any>(tableName: string, filter: any) {
    return this.query<T>('DELETE', tableName, () => {
      return this.client.from(tableName as any).delete().match(filter);
    });
  }

  /**
   * Upsert with logging - uses the original client methods
   */
  async upsertWithLogging<T = any>(tableName: string, data: any) {
    return this.query<T>('UPSERT', tableName, () => {
      return this.client.from(tableName as any).upsert(data).select();
    });
  }

  /**
   * Call RPC function with logging - uses the original client methods
   */
  async rpcWithLogging<T = any>(functionName: string, params?: any) {
    return this.query<T>('RPC', functionName, () => {
      return this.client.rpc(functionName as any, params);
    });
  }

  /**
   * Get auth user with logging
   */
  async getUser() {
    const startTime = Date.now();
    
    try {
      const result = await this.client.auth.getUser();
      const duration = Date.now() - startTime;
      
      loggerUtils.logAuth('get_user', result.data.user?.id, !result.error, {
        duration,
        hasUser: !!result.data.user
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerUtils.logAuth('get_user', undefined, false, {
        duration,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Sign in with logging
   */
  async signIn(email: string, password: string) {
    const startTime = Date.now();
    
    try {
      const result = await this.client.auth.signInWithPassword({
        email,
        password
      });
      const duration = Date.now() - startTime;
      
      loggerUtils.logAuth('sign_in', result.data.user?.id, !result.error, {
        duration,
        email,
        success: !result.error
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerUtils.logAuth('sign_in', undefined, false, {
        duration,
        email,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Sign out with logging
   */
  async signOut() {
    const startTime = Date.now();
    
    try {
      // Get current user before signing out
      const { data: { user } } = await this.client.auth.getUser();
      const result = await this.client.auth.signOut();
      const duration = Date.now() - startTime;
      
      loggerUtils.logAuth('sign_out', user?.id, !result.error, {
        duration,
        success: !result.error
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerUtils.logAuth('sign_out', undefined, false, {
        duration,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get original client for complex operations
   */
  getClient() {
    return this.client;
  }
}

/**
 * Logged Supabase client instance
 */
export const loggedSupabase = new LoggedSupabaseClient();

export default loggedSupabase;