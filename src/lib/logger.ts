import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, errors, json, colorize, simple, printf } = winston.format;

// Custom format for development
const developmentFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  const stackString = stack ? `\n${stack}` : '';
  return `${timestamp} [${level}]: ${message}${stackString}${metaString}`;
});

// Create logger configuration
const createLogger = () => {
  const isProduction = import.meta.env.PROD;
  const isDevelopment = import.meta.env.DEV;

  // Base configuration
  const baseFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    errors({ stack: true })
  );

  // Transports array
  const transports: winston.transport[] = [];

  if (isDevelopment) {
    // Console transport for development
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: combine(
          baseFormat,
          colorize(),
          developmentFormat
        )
      })
    );
  }

  if (isProduction) {
    // Daily rotate file transport for production
    const dailyRotateTransport = new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d', // Keep logs for 14 days
      level: 'info',
      format: combine(baseFormat, json())
    });

    // Error-only log file
    const errorRotateTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // Keep error logs for 30 days
      level: 'error',
      format: combine(baseFormat, json())
    });

    transports.push(dailyRotateTransport, errorRotateTransport);

    // Event listeners for rotation
    dailyRotateTransport.on('rotate', (oldFilename, newFilename) => {
      console.log(`Log rotated: ${oldFilename} -> ${newFilename}`);
    });

    errorRotateTransport.on('rotate', (oldFilename, newFilename) => {
      console.log(`Error log rotated: ${oldFilename} -> ${newFilename}`);
    });
  } else {
    // Console transport for non-production environments
    transports.push(
      new winston.transports.Console({
        level: 'info',
        format: combine(baseFormat, json())
      })
    );
  }

  return winston.createLogger({
    level: isDevelopment ? 'debug' : 'info',
    format: baseFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
    // Handle uncaught exceptions
    exceptionHandlers: isProduction ? [
      new DailyRotateFile({
        filename: 'logs/exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(baseFormat, json())
      })
    ] : [
      new winston.transports.Console({
        format: combine(baseFormat, colorize(), developmentFormat)
      })
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: isProduction ? [
      new DailyRotateFile({
        filename: 'logs/rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(baseFormat, json())
      })
    ] : [
      new winston.transports.Console({
        format: combine(baseFormat, colorize(), developmentFormat)
      })
    ]
  });
};

// Create the logger instance
export const logger = createLogger();

// Helper functions for structured logging
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
    logger.log(level, 'Database Operation', {
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
    const level = success ? 'info' : 'warn';
    logger.log(level, 'Authentication Event', {
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
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    logger.log(level, 'Security Event', {
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

export default logger;