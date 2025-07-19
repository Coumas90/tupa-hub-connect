/**
 * Tests for TupaHubClient
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TupaHubClient } from '../tupahub.client';
import { TupaHubError } from '../utils/errors';
import type { SalePayload, ClientPayload, TupaConfig } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TupaHubClient', () => {
  const validConfig: TupaConfig = {
    apiKey: 'test-api-key',
    endpoint: 'https://api.tupahub.com',
    version: 'v1',
    timeout: 30000,
    maxRetries: 3
  };

  const mockSalePayload: SalePayload = {
    id: 'sale-123',
    total: 100.50,
    date: new Date().toISOString(),
    clientId: 'client-456',
    items: [
      {
        id: 'item-1',
        name: 'Test Product',
        quantity: 2,
        price: 50.25
      }
    ],
    paymentMethod: 'card'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with valid config', () => {
      const client = new TupaHubClient(validConfig);
      expect(client).toBeInstanceOf(TupaHubClient);
    });

    it('should throw error for missing API key', () => {
      expect(() => {
        new TupaHubClient({ ...validConfig, apiKey: '' });
      }).toThrow('API Key is required');
    });

    it('should throw error for invalid endpoint', () => {
      expect(() => {
        new TupaHubClient({ ...validConfig, endpoint: 'invalid-url' });
      }).toThrow();
    });

    it('should apply default values', () => {
      const minimalConfig = {
        apiKey: 'test-key',
        endpoint: 'https://api.test.com'
      };
      const client = new TupaHubClient(minimalConfig);
      expect(client).toBeInstanceOf(TupaHubClient);
    });
  });

  describe('createSale', () => {
    it('should create sale successfully', async () => {
      const mockResponse = {
        data: mockSalePayload,
        success: true,
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new TupaHubClient(validConfig);
      const result = await client.createSale(mockSalePayload);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/sales'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockSalePayload)
        })
      );
    });

    it('should validate sale payload', async () => {
      const invalidSale = { ...mockSalePayload, id: '', total: -100 };
      const client = new TupaHubClient(validConfig);

      await expect(client.createSale(invalidSale)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ code: 'INVALID_DATA', message: 'Invalid sale data' })
      });

      const client = new TupaHubClient(validConfig);
      
      await expect(client.createSale(mockSalePayload)).rejects.toThrow(TupaHubError);
    });
  });

  describe('getClient', () => {
    it('should fetch client successfully', async () => {
      const mockClient: ClientPayload = {
        id: 'client-123',
        name: 'Test Client',
        email: 'test@example.com'
      };

      const mockResponse = {
        data: mockClient,
        success: true,
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new TupaHubClient(validConfig);
      const result = await client.getClient('client-123');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/clients/client-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('should handle client not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ code: 'CLIENT_NOT_FOUND', message: 'Client not found' })
      });

      const client = new TupaHubClient(validConfig);
      
      await expect(client.getClient('nonexistent')).rejects.toThrow(TupaHubError);
    });
  });

  describe('listProducts', () => {
    it('should list products with parameters', async () => {
      const mockProducts = [
        { id: 'p1', name: 'Product 1', price: 10, active: true },
        { id: 'p2', name: 'Product 2', price: 20, active: true }
      ];

      const mockResponse = {
        data: mockProducts,
        success: true,
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new TupaHubClient(validConfig);
      const result = await client.listProducts({ 
        category: 'beverages', 
        active: true, 
        limit: 10 
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=beverages&active=true&limit=10'),
        expect.any(Object)
      );
    });

    it('should validate list parameters', async () => {
      const client = new TupaHubClient(validConfig);
      
      await expect(
        client.listProducts({ limit: -1 })
      ).rejects.toThrow();
      
      await expect(
        client.listProducts({ limit: 2000 })
      ).rejects.toThrow();
    });
  });

  describe('updateClient', () => {
    it('should update client successfully', async () => {
      const updateData = { email: 'newemail@example.com' };
      const mockResponse = {
        data: { id: 'client-123', name: 'Test Client', ...updateData },
        success: true,
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new TupaHubClient(validConfig);
      const result = await client.updateClient('client-123', updateData);

      expect(result).toEqual(mockResponse);
    });

    it('should reject empty update data', async () => {
      const client = new TupaHubClient(validConfig);
      
      await expect(client.updateClient('client-123', {})).rejects.toThrow(
        'Client data cannot be empty'
      );
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockResponse = {
        data: { status: 'healthy', timestamp: new Date().toISOString() },
        success: true,
        timestamp: new Date().toISOString()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const client = new TupaHubClient(validConfig);
      const result = await client.healthCheck();

      expect(result.data.status).toBe('healthy');
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {}, success: true, timestamp: new Date().toISOString() })
        });

      const client = new TupaHubClient(validConfig);
      const result = await client.healthCheck();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const client = new TupaHubClient(validConfig);
      
      await expect(client.healthCheck()).rejects.toThrow('MAX_RETRIES_EXCEEDED');
      expect(mockFetch).toHaveBeenCalledTimes(3); // maxRetries
    });
  });

  describe('Request Headers', () => {
    it('should include correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {}, success: true, timestamp: new Date().toISOString() })
      });

      const client = new TupaHubClient(validConfig);
      await client.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
            'User-Agent': 'TupaHub-SDK/v1',
            'X-API-Version': 'v1'
          })
        })
      );
    });
  });
});