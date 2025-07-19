/**
 * Simple logger utility for SDK
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

/**
 * Create a logger instance
 * @param namespace Logger namespace
 * @param level Minimum log level (default: 'info')
 * @returns Logger instance
 */
export function createLogger(namespace: string, level: LogLevel = 'info'): Logger {
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

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${namespace}] [${logLevel.toUpperCase()}]`;
    
    if (data) {
      console[logLevel === 'debug' ? 'log' : logLevel](
        `${prefix} ${message}`,
        data
      );
    } else {
      console[logLevel === 'debug' ? 'log' : logLevel](
        `${prefix} ${message}`
      );
    }
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
  setLevel: (level: LogLevel) => {
    globalLogger.level = level;
  }
};