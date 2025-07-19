/**
 * Tests for AdapterRegistry
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdapterRegistry, type POSAdapter, type SyncResult } from '../../adapters/registry';
import { TupaHubClient } from '../../tupahub.client';

// Mock adapter for testing
class MockAdapter implements POSAdapter {
  name = 'mock';
  version = '1.0.0';
  
  constructor(private shouldFail = false) {}

  async syncSales(): Promise<SyncResult> {
    if (this.shouldFail) {
      throw new Error('Mock sync failed');
    }
    
    return {
      success: true,
      recordsProcessed: 5,
      errors: [],
      timestamp: new Date().toISOString(),
      details: { test: true }
    };
  }

  async healthCheck(): Promise<boolean> {
    return !this.shouldFail;
  }
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;
  let mockClient: TupaHubClient;

  beforeEach(() => {
    registry = new AdapterRegistry();
    mockClient = {} as TupaHubClient; // Mock client for testing
  });

  describe('register and getAdapter', () => {
    it('should register and retrieve adapter', () => {
      const adapter = new MockAdapter();
      registry.register(adapter);

      const retrieved = registry.getAdapter('mock');
      expect(retrieved).toBe(adapter);
    });

    it('should be case insensitive', () => {
      const adapter = new MockAdapter();
      registry.register(adapter);

      expect(registry.getAdapter('MOCK')).toBe(adapter);
      expect(registry.getAdapter('Mock')).toBe(adapter);
    });

    it('should return undefined for non-existent adapter', () => {
      expect(registry.getAdapter('nonexistent')).toBeUndefined();
    });
  });

  describe('listAdapters', () => {
    it('should list all registered adapters', () => {
      const adapter1 = new MockAdapter();
      const adapter2 = new MockAdapter();
      adapter2.name = 'mock2';
      adapter2.version = '2.0.0';

      registry.register(adapter1);
      registry.register(adapter2);

      const list = registry.listAdapters();
      expect(list).toHaveLength(2);
      expect(list).toContainEqual({ name: 'mock', version: '1.0.0' });
      expect(list).toContainEqual({ name: 'mock2', version: '2.0.0' });
    });

    it('should return empty array when no adapters', () => {
      expect(registry.listAdapters()).toEqual([]);
    });
  });

  describe('syncAll', () => {
    it('should sync all adapters successfully', async () => {
      const adapter1 = new MockAdapter();
      const adapter2 = new MockAdapter();
      adapter2.name = 'mock2';

      registry.register(adapter1);
      registry.register(adapter2);

      const results = await registry.syncAll(mockClient);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results.mock.success).toBe(true);
      expect(results.mock2.success).toBe(true);
      expect(results.mock.recordsProcessed).toBe(5);
    });

    it('should handle adapter failures gracefully', async () => {
      const successAdapter = new MockAdapter();
      const failAdapter = new MockAdapter(true);
      failAdapter.name = 'failing';

      registry.register(successAdapter);
      registry.register(failAdapter);

      const results = await registry.syncAll(mockClient);

      expect(results.mock.success).toBe(true);
      expect(results.failing.success).toBe(false);
      expect(results.failing.errors).toContain('Mock sync failed');
    });

    it('should return empty object when no adapters', async () => {
      const results = await registry.syncAll(mockClient);
      expect(results).toEqual({});
    });
  });

  describe('healthCheckAll', () => {
    it('should check health of all adapters', async () => {
      const healthyAdapter = new MockAdapter();
      const unhealthyAdapter = new MockAdapter(true);
      unhealthyAdapter.name = 'unhealthy';

      registry.register(healthyAdapter);
      registry.register(unhealthyAdapter);

      const results = await registry.healthCheckAll();

      expect(results.mock).toBe(true);
      expect(results.unhealthy).toBe(false);
    });

    it('should handle health check errors', async () => {
      const adapter = new MockAdapter();
      // Mock healthCheck to throw
      adapter.healthCheck = vi.fn().mockRejectedValue(new Error('Health check failed'));
      
      registry.register(adapter);

      const results = await registry.healthCheckAll();
      expect(results.mock).toBe(false);
    });
  });

  describe('unregister', () => {
    it('should remove adapter from registry', () => {
      const adapter = new MockAdapter();
      registry.register(adapter);

      expect(registry.getAdapter('mock')).toBe(adapter);
      
      const removed = registry.unregister('mock');
      expect(removed).toBe(true);
      expect(registry.getAdapter('mock')).toBeUndefined();
    });

    it('should return false for non-existent adapter', () => {
      const removed = registry.unregister('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all adapters', () => {
      const adapter1 = new MockAdapter();
      const adapter2 = new MockAdapter();
      adapter2.name = 'mock2';

      registry.register(adapter1);
      registry.register(adapter2);

      expect(registry.listAdapters()).toHaveLength(2);

      registry.clear();
      expect(registry.listAdapters()).toHaveLength(0);
    });
  });
});