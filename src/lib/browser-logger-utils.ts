import { logger } from './browser-logger';

/**
 * Browser-compatible logger utilities
 * Provides structured logging helpers that work in browser environment
 */
export const loggerUtils = {
  /**
   * Log API request
   */
  logRequest: (method: string, url: string, userId?: string, requestId?: string) => {
    logger.info('API Request', {
      type: 'request',
      method,
      url,
      userId,
      requestId,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log API response
   */
  logResponse: (method: string, url: string, statusCode: number, duration: number, userId?: string, requestId?: string) => {
    logger.info('API Response', {
      type: 'response',
      method,
      url,
      statusCode,
      duration,
      userId,
      requestId,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log API error
   */
  logError: (method: string, url: string, error: Error, userId?: string, requestId?: string) => {
    logger.error('API Error', {
      type: 'error',
      method,
      url,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      userId,
      requestId,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log database operation
   */
  logDatabase: (operation: string, table: string, success: boolean, duration?: number, error?: Error) => {
    const level = success ? 'info' : 'error';
    const logMethod = success ? logger.info.bind(logger) : logger.error.bind(logger);
    
    logMethod('Database Operation', {
      type: 'database',
      operation,
      table,
      success,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log authentication event
   */
  logAuth: (event: string, userId?: string, success: boolean = true, details?: Record<string, any>) => {
    const logMethod = success ? logger.info.bind(logger) : logger.warn.bind(logger);
    
    logMethod('Authentication Event', {
      type: 'auth',
      event,
      userId,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log security event
   */
  logSecurity: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, any>) => {
    const logMethod = severity === 'critical' ? logger.error.bind(logger) : 
                     severity === 'high' ? logger.warn.bind(logger) : 
                     logger.info.bind(logger);
    
    logMethod('Security Event', {
      type: 'security',
      event,
      severity,
      details,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log performance metric
   */
  logPerformance: (metric: string, value: number, unit: string, details?: Record<string, any>) => {
    logger.info('Performance Metric', {
      type: 'performance',
      metric,
      value,
      unit,
      details,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log business event
   */
  logBusiness: (event: string, data: Record<string, any>) => {
    logger.info('Business Event', {
      type: 'business',
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }
};