/**
 * Tests for main SDK exports
 */
import { describe, it, expect } from 'vitest';

describe('SDK Exports', () => {
  it('should export main client', async () => {
    const { TupaHubClient } = await import('../index');
    expect(TupaHubClient).toBeDefined();
    expect(typeof TupaHubClient).toBe('function');
  });

  it('should export error classes', async () => {
    const { TupaHubError } = await import('../index');
    expect(TupaHubError).toBeDefined();
    expect(typeof TupaHubError).toBe('function');
  });

  it('should export logging utilities', async () => {
    const { createLogger, LoggerProviders } = await import('../index');
    expect(createLogger).toBeDefined();
    expect(LoggerProviders).toBeDefined();
    expect(typeof createLogger).toBe('function');
  });

  it('should export validation functions', async () => {
    const { 
      validateSalePayload, 
      validateClientPayload,
      isSalePayload,
      isClientPayload 
    } = await import('../index');
    
    expect(validateSalePayload).toBeDefined();
    expect(validateClientPayload).toBeDefined();
    expect(isSalePayload).toBeDefined();
    expect(isClientPayload).toBeDefined();
  });

  it('should export adapters', async () => {
    const { FudoAdapter, AdapterRegistry } = await import('../index');
    expect(FudoAdapter).toBeDefined();
    expect(AdapterRegistry).toBeDefined();
  });

  it('should export registry utilities', async () => {
    const { adapterRegistry, registerDefaultAdapters, quickSync } = await import('../index');
    expect(adapterRegistry).toBeDefined();
    expect(registerDefaultAdapters).toBeDefined();
    expect(quickSync).toBeDefined();
  });

  it('should have stable API surface', async () => {
    const exports = await import('../index');
    const exportKeys = Object.keys(exports).sort();
    
    // Ensure we have all expected exports
    const expectedExports = [
      'TupaHubClient',
      'TupaHubError',
      'createLogger',
      'LoggerProviders', 
      'ConsoleLoggerProvider',
      'SilentLoggerProvider',
      'JSONLoggerProvider',
      'globalLogger',
      'validateSalePayload',
      'validateClientPayload',
      'validateProduct',
      'validateTupaConfig',
      'validateProductListParams',
      'safeParseSalePayload',
      'safeParseClientPayload',
      'safeParseProduct',
      'safeParseTupaConfig',
      'isSalePayload',
      'isClientPayload',
      'isProduct',
      'FudoAdapter',
      'AdapterRegistry',
      'adapterRegistry',
      'registerDefaultAdapters',
      'quickSync'
    ];

    for (const expectedExport of expectedExports) {
      expect(exportKeys).toContain(expectedExport);
    }
  });
});