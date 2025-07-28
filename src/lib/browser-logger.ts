/**
 * Browser-compatible logger replacement for Winston
 * Provides similar API but works in browser environment
 */

interface LogLevel {
  level: string;
  priority: number;
  color: string;
}

const LOG_LEVELS: Record<string, LogLevel> = {
  error: { level: 'error', priority: 0, color: '#ef4444' },
  warn: { level: 'warn', priority: 1, color: '#f59e0b' },
  info: { level: 'info', priority: 2, color: '#3b82f6' },
  debug: { level: 'debug', priority: 3, color: '#8b5cf6' },
};

class BrowserLogger {
  private level: string = 'info';

  constructor(options: { level?: string } = {}) {
    this.level = options.level || 'info';
  }

  private shouldLog(level: string): boolean {
    const currentLevel = LOG_LEVELS[this.level];
    const messageLevel = LOG_LEVELS[level];
    return messageLevel && currentLevel && messageLevel.priority <= currentLevel.priority;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  private log(level: string, message: string, meta?: any) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    const logLevel = LOG_LEVELS[level];

    if (logLevel) {
      console.log(
        `%c${formattedMessage}`,
        `color: ${logLevel.color}; font-weight: bold;`
      );
    } else {
      console.log(formattedMessage);
    }
  }

  error(message: string, meta?: any) {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: any) {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: any) {
    this.log('info', message, meta);
  }

  debug(message: string, meta?: any) {
    this.log('debug', message, meta);
  }
}

// Create default logger instance
export const logger = new BrowserLogger({
  level: import.meta.env.DEV ? 'debug' : 'info'
});

// Export utilities
export { loggerUtils } from './browser-logger-utils';

// Export for compatibility with Winston API
export default logger;