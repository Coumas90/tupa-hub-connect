/**
 * Tests for logger utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createLogger, 
  LoggerProviders,
  ConsoleLoggerProvider,
  SilentLoggerProvider,
  JSONLoggerProvider,
  globalLogger
} from '../../utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create logger with default console provider', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('Test');
      logger.info('test message');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] test message')
      );
      
      consoleSpy.mockRestore();
    });

    it('should respect log levels', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const logger = createLogger('Test', 'warn');
      logger.debug('should not log');
      logger.info('should not log');
      logger.warn('should log');

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('should not log')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('should log')
      );
      
      consoleSpy.mockRestore();
    });

    it('should include data in logs', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const logger = createLogger('Test');
      const testData = { key: 'value' };
      logger.info('test message', testData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test] test message'),
        testData
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('ConsoleLoggerProvider', () => {
    it('should log to console with timestamp', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const provider = new ConsoleLoggerProvider();
      provider.log('test message', 'info');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] test message/)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle data parameter', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const provider = new ConsoleLoggerProvider();
      const testData = { error: 'test error' };
      provider.log('error message', 'error', testData);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('error message'),
        testData
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('SilentLoggerProvider', () => {
    it('should not log anything', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      
      const provider = new SilentLoggerProvider();
      provider.log('test message', 'info');

      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('JSONLoggerProvider', () => {
    it('should log structured JSON', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const provider = new JSONLoggerProvider();
      provider.log('test message', 'info', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/{"timestamp":".*","level":"info","message":"test message","data":{"key":"value"}}/)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle messages without data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const provider = new JSONLoggerProvider();
      provider.log('simple message', 'warn');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/{"timestamp":".*","level":"warn","message":"simple message"}/)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('LoggerProviders factory', () => {
    it('should create console provider', () => {
      const provider = LoggerProviders.console();
      expect(provider).toBeInstanceOf(ConsoleLoggerProvider);
    });

    it('should create silent provider', () => {
      const provider = LoggerProviders.silent();
      expect(provider).toBeInstanceOf(SilentLoggerProvider);
    });

    it('should create JSON provider', () => {
      const provider = LoggerProviders.json();
      expect(provider).toBeInstanceOf(JSONLoggerProvider);
    });

    it('should create custom provider', () => {
      const mockLogFn = vi.fn();
      const provider = LoggerProviders.custom(mockLogFn);
      
      provider.log('test', 'info', { data: true });
      
      expect(mockLogFn).toHaveBeenCalledWith('test', 'info', { data: true });
    });
  });

  describe('Custom provider integration', () => {
    it('should use custom provider in logger', () => {
      const mockLogFn = vi.fn();
      const customProvider = LoggerProviders.custom(mockLogFn);
      
      const logger = createLogger('Test', 'info', customProvider);
      logger.info('test message', { key: 'value' });

      expect(mockLogFn).toHaveBeenCalledWith(
        '[Test] test message',
        'info',
        { key: 'value' }
      );
    });
  });

  describe('globalLogger', () => {
    it('should have default configuration', () => {
      expect(globalLogger.level).toBe('info');
      expect(globalLogger.provider).toBeInstanceOf(ConsoleLoggerProvider);
    });

    it('should allow level updates', () => {
      globalLogger.setLevel('debug');
      expect(globalLogger.level).toBe('debug');
      
      // Reset to default
      globalLogger.setLevel('info');
    });

    it('should allow provider updates', () => {
      const newProvider = new SilentLoggerProvider();
      globalLogger.setProvider(newProvider);
      expect(globalLogger.provider).toBe(newProvider);
      
      // Reset to default
      globalLogger.setProvider(new ConsoleLoggerProvider());
    });
  });
});