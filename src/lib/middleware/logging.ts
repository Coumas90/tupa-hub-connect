import { logger, loggerUtils } from '@/lib/browser-logger';

// Types for middleware
interface LoggingRequest extends Request {
  startTime?: number;
  requestId?: string;
  userId?: string;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Edge Function logging wrapper with request logging
 */
export function withRequestLogging<T extends any[], R>(
  handler: (req: Request, ...args: T) => Promise<Response>,
  functionName: string
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Extract user ID from auth header if available
    const authHeader = req.headers.get('authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        userId = extractUserIdFromAuth(authHeader);
      } catch (error) {
        // Ignore auth extraction errors for logging
      }
    }

    // Log the incoming request
    loggerUtils.logRequest(
      req.method,
      req.url,
      userId,
      requestId
    );

    try {
      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;
      
      // Log successful response
      loggerUtils.logResponse(
        req.method,
        req.url,
        response.status,
        duration,
        userId,
        requestId
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      loggerUtils.logError(
        req.method,
        req.url,
        error as Error,
        userId,
        requestId
      );

      // Log additional context
      logger.error('Request Error Context', {
        requestId,
        userId,
        userAgent: req.headers.get('user-agent'),
        referer: req.headers.get('referer'),
        timestamp: new Date().toISOString()
      });

      throw error;
    }
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
    const requestId = generateRequestId();
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
    nodeVersion: 'browser',
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
  withRequestLogging,
  withLogging,
  withDatabaseLogging,
  handleApiError,
  logApplicationStart,
  logApplicationStop
};