import { logger, loggerUtils } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Types for middleware
interface LoggingRequest extends Request {
  startTime?: number;
  requestId?: string;
  userId?: string;
}

interface LoggingResponse extends Response {
  locals?: {
    requestId?: string;
    userId?: string;
  };
}

/**
 * Request logging middleware for Express-like APIs
 */
export function requestLoggingMiddleware() {
  return (req: LoggingRequest, res: LoggingResponse, next: () => void) => {
    // Generate unique request ID
    req.requestId = uuidv4();
    req.startTime = Date.now();

    // Extract user ID from auth header if available
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // This would need to be adapted based on your auth implementation
      try {
        // Extract user ID from JWT or session
        req.userId = extractUserIdFromAuth(authHeader);
      } catch (error) {
        // Ignore auth extraction errors for logging
      }
    }

    // Log the incoming request
    loggerUtils.logRequest(
      req.method,
      req.url,
      req.userId,
      req.requestId
    );

    // Override response methods to log responses
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;

    const logResponse = () => {
      const duration = req.startTime ? Date.now() - req.startTime : 0;
      loggerUtils.logResponse(
        req.method,
        req.url,
        res.status,
        duration,
        req.userId,
        req.requestId
      );
    };

    res.send = function(data: any) {
      logResponse();
      return originalSend.call(this, data);
    };

    res.json = function(data: any) {
      logResponse();
      return originalJson.call(this, data);
    };

    res.end = function(chunk?: any, encoding?: any) {
      logResponse();
      return originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Error logging middleware for APIs
 */
export function errorLoggingMiddleware() {
  return (error: Error, req: LoggingRequest, res: LoggingResponse, next: (error?: Error) => void) => {
    // Log the error with request context
    loggerUtils.logError(
      req.method,
      req.url,
      error,
      req.userId,
      req.requestId
    );

    // Log additional context if available
    logger.error('Error Context', {
      requestId: req.requestId,
      userId: req.userId,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      referer: req.headers.get('referer'),
      timestamp: new Date().toISOString()
    });

    next(error);
  };
}

/**
 * Supabase Edge Function logging wrapper
 */
export function withLogging<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  functionName: string
) {
  return async (...args: T): Promise<R> => {
    const requestId = uuidv4();
    const startTime = Date.now();
    
    logger.info('Edge Function Started', {
      type: 'edge_function',
      functionName,
      requestId,
      timestamp: new Date().toISOString()
    });

    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      logger.info('Edge Function Completed', {
        type: 'edge_function',
        functionName,
        requestId,
        duration,
        success: true,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Edge Function Failed', {
        type: 'edge_function',
        functionName,
        requestId,
        duration,
        success: false,
        error: {
          name: (error as Error).name,
          message: (error as Error).message,
          stack: (error as Error).stack
        },
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  };
}

/**
 * Database operation logging wrapper
 */
export function withDatabaseLogging<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  tableName: string,
  operationType: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await operation(...args);
      const duration = Date.now() - startTime;
      
      loggerUtils.logDatabase(operationType, tableName, true, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggerUtils.logDatabase(operationType, tableName, false, duration, error as Error);
      throw error;
    }
  };
}

/**
 * API route error handler
 */
export function handleApiError(error: Error, context?: Record<string, any>) {
  logger.error('API Error Handler', {
    type: 'api_error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  });

  // Return standardized error response
  return {
    success: false,
    error: {
      message: error.message,
      code: getErrorCode(error),
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Extract user ID from authorization header
 */
function extractUserIdFromAuth(authHeader: string): string | undefined {
  try {
    // Remove 'Bearer ' prefix
    const token = authHeader.replace(/^Bearer\s+/, '');
    
    // This would depend on your auth implementation
    // For JWT tokens, you'd decode the token
    // For session tokens, you'd look up the session
    
    // Placeholder implementation
    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Get error code from error object
 */
function getErrorCode(error: Error): string {
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR';
  if (error.name === 'UnauthorizedError') return 'UNAUTHORIZED';
  if (error.name === 'ForbiddenError') return 'FORBIDDEN';
  if (error.name === 'NotFoundError') return 'NOT_FOUND';
  if (error.message.includes('duplicate key')) return 'DUPLICATE_ENTRY';
  if (error.message.includes('foreign key')) return 'FOREIGN_KEY_VIOLATION';
  
  return 'INTERNAL_ERROR';
}

/**
 * Log application startup
 */
export function logApplicationStart() {
  logger.info('Application Started', {
    type: 'application',
    event: 'startup',
    environment: import.meta.env.MODE,
    nodeVersion: process?.version || 'unknown',
    timestamp: new Date().toISOString()
  });
}

/**
 * Log application shutdown
 */
export function logApplicationStop(reason?: string) {
  logger.info('Application Stopping', {
    type: 'application',
    event: 'shutdown',
    reason,
    timestamp: new Date().toISOString()
  });
}

export default {
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  withLogging,
  withDatabaseLogging,
  handleApiError,
  logApplicationStart,
  logApplicationStop
};