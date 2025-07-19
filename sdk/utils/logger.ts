/**
 * Abstract logger utility for SDK with pluggable providers
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

/**
 * Abstract logger provider interface for custom implementations
 */
export interface LoggerProvider {
  log(message: string, level: LogLevel, data?: any): void;
}

/**
 * Console logger provider (default)
 */
export class ConsoleLoggerProvider implements LoggerProvider {
  log(message: string, level: LogLevel, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      console[level === 'debug' ? 'log' : level](logMessage, data);
    } else {
      console[level === 'debug' ? 'log' : level](logMessage);
    }
  }
}

/**
 * No-op logger provider for silent mode
 */
export class SilentLoggerProvider implements LoggerProvider {
  log(): void {
    // Do nothing
  }
}

/**
 * JSON logger provider for structured logging
 */
export class JSONLoggerProvider implements LoggerProvider {
  log(message: string, level: LogLevel, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(data && { data })
    };
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Create a logger instance with configurable provider
 * @param namespace Logger namespace
 * @param level Minimum log level (default: 'info')
 * @param provider Logger provider (default: ConsoleLoggerProvider)
 * @returns Logger instance
 */
export function createLogger(
  namespace: string, 
  level: LogLevel = 'info',
  provider: LoggerProvider = new ConsoleLoggerProvider()
): Logger {
  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  const currentLevel = levels[level];

  const log = (logLevel: LogLevel, message: string, data?: any) => {
    if (levels[logLevel] < currentLevel) {
      return;
    }

    const namespacedMessage = `[${namespace}] ${message}`;
    provider.log(namespacedMessage, logLevel, data);
  };

  return {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data)
  };
}

/**
 * Global logger configuration
 */
export const globalLogger = {
  level: 'info' as LogLevel,
  provider: new ConsoleLoggerProvider() as LoggerProvider,
  setLevel: (level: LogLevel) => {
    globalLogger.level = level;
  },
  setProvider: (provider: LoggerProvider) => {
    globalLogger.provider = provider;
  }
};

/**
 * Factory functions for common logger providers
 */
export const LoggerProviders = {
  console: () => new ConsoleLoggerProvider(),
  silent: () => new SilentLoggerProvider(), 
  json: () => new JSONLoggerProvider(),
  custom: (logFn: (message: string, level: LogLevel, data?: any) => void): LoggerProvider => ({
    log: logFn
  })
};