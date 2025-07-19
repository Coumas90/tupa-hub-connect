/**
 * Tests for Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  validateSalePayload,
  validateClientPayload,
  validateProduct,
  validateTupaConfig,
  validateProductListParams,
  safeParseSalePayload,
  isSalePayload,
  isClientPayload,
  isProduct
} from '../schemas';
import type { SalePayload, ClientPayload, Product, TupaConfig } from '../types';

describe('Validation Schemas', () => {
  describe('SalePayload validation', () => {
    const validSale: SalePayload = {
      id: 'sale-123',
      total: 100.50,
      date: new Date().toISOString(),
      clientId: 'client-456',
      items: [
        {
          id: 'item-1',
          name: 'Test Product',
          quantity: 2,
          price: 50.25,
          category: 'beverages'
        }
      ],
      paymentMethod: 'card'
    };

    it('should validate correct sale payload', () => {
      expect(() => validateSalePayload(validSale)).not.toThrow();
    });

    it('should reject sale with missing required fields', () => {
      const invalidSale = { ...validSale };
      delete (invalidSale as any).id;
      
      expect(() => validateSalePayload(invalidSale)).toThrow();
    });

    it('should reject sale with negative total', () => {
      const invalidSale = { ...validSale, total: -100 };
      
      expect(() => validateSalePayload(invalidSale)).toThrow();
    });

    it('should reject sale with invalid date', () => {
      const invalidSale = { ...validSale, date: 'invalid-date' };
      
      expect(() => validateSalePayload(invalidSale)).toThrow();
    });

    it('should reject sale with empty items array', () => {
      const invalidSale = { ...validSale, items: [] };
      
      expect(() => validateSalePayload(invalidSale)).toThrow();
    });

    it('should reject item with negative quantity', () => {
      const invalidSale = {
        ...validSale,
        items: [{ ...validSale.items[0], quantity: -1 }]
      };
      
      expect(() => validateSalePayload(invalidSale)).toThrow();
    });

    it('should work with safe parse', () => {
      const result = safeParseSalePayload(validSale);
      expect(result.success).toBe(true);

      const invalidResult = safeParseSalePayload({ invalid: 'data' });
      expect(invalidResult.success).toBe(false);
    });

    it('should work with type guard', () => {
      expect(isSalePayload(validSale)).toBe(true);
      expect(isSalePayload({ invalid: 'data' })).toBe(false);
    });
  });

  describe('ClientPayload validation', () => {
    const validClient: ClientPayload = {
      id: 'client-123',
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890',
      type: 'business'
    };

    it('should validate correct client payload', () => {
      expect(() => validateClientPayload(validClient)).not.toThrow();
    });

    it('should reject client with missing name', () => {
      const invalidClient = { ...validClient };
      delete (invalidClient as any).name;
      
      expect(() => validateClientPayload(invalidClient)).toThrow();
    });

    it('should reject client with invalid email', () => {
      const invalidClient = { ...validClient, email: 'invalid-email' };
      
      expect(() => validateClientPayload(invalidClient)).toThrow();
    });

    it('should reject client with invalid type', () => {
      const invalidClient = { ...validClient, type: 'invalid' as any };
      
      expect(() => validateClientPayload(invalidClient)).toThrow();
    });

    it('should work with type guard', () => {
      expect(isClientPayload(validClient)).toBe(true);
      expect(isClientPayload({ invalid: 'data' })).toBe(false);
    });
  });

  describe('Product validation', () => {
    const validProduct: Product = {
      id: 'product-123',
      name: 'Test Product',
      description: 'A test product',
      price: 29.99,
      category: 'beverages',
      sku: 'SKU123',
      stock: 100,
      active: true
    };

    it('should validate correct product', () => {
      expect(() => validateProduct(validProduct)).not.toThrow();
    });

    it('should reject product with negative price', () => {
      const invalidProduct = { ...validProduct, price: -10 };
      
      expect(() => validateProduct(invalidProduct)).toThrow();
    });

    it('should reject product with negative stock', () => {
      const invalidProduct = { ...validProduct, stock: -5 };
      
      expect(() => validateProduct(invalidProduct)).toThrow();
    });

    it('should reject product with non-integer stock', () => {
      const invalidProduct = { ...validProduct, stock: 10.5 };
      
      expect(() => validateProduct(invalidProduct)).toThrow();
    });

    it('should work with type guard', () => {
      expect(isProduct(validProduct)).toBe(true);
      expect(isProduct({ invalid: 'data' })).toBe(false);
    });
  });

  describe('TupaConfig validation', () => {
    const validConfig: TupaConfig = {
      apiKey: 'test-api-key',
      endpoint: 'https://api.tupahub.com',
      version: 'v1',
      timeout: 30000,
      maxRetries: 3
    };

    it('should validate correct config', () => {
      expect(() => validateTupaConfig(validConfig)).not.toThrow();
    });

    it('should reject config with missing API key', () => {
      const invalidConfig = { ...validConfig, apiKey: '' };
      
      expect(() => validateTupaConfig(invalidConfig)).toThrow();
    });

    it('should reject config with invalid endpoint', () => {
      const invalidConfig = { ...validConfig, endpoint: 'not-a-url' };
      
      expect(() => validateTupaConfig(invalidConfig)).toThrow();
    });

    it('should reject config with zero timeout', () => {
      const invalidConfig = { ...validConfig, timeout: 0 };
      
      expect(() => validateTupaConfig(invalidConfig)).toThrow();
    });

    it('should reject config with zero retries', () => {
      const invalidConfig = { ...validConfig, maxRetries: 0 };
      
      expect(() => validateTupaConfig(invalidConfig)).toThrow();
    });

    it('should apply defaults', () => {
      const minimalConfig = {
        apiKey: 'test-key',
        endpoint: 'https://api.test.com'
      };
      
      const result = validateTupaConfig(minimalConfig);
      expect(result.version).toBe('v1');
      expect(result.timeout).toBe(30000);
      expect(result.maxRetries).toBe(3);
    });
  });

  describe('ProductListParams validation', () => {
    it('should validate correct parameters', () => {
      const validParams = {
        category: 'beverages',
        active: true,
        limit: 50,
        offset: 0
      };
      
      expect(() => validateProductListParams(validParams)).not.toThrow();
    });

    it('should reject negative limit', () => {
      const invalidParams = { limit: -1 };
      
      expect(() => validateProductListParams(invalidParams)).toThrow();
    });

    it('should reject limit over 1000', () => {
      const invalidParams = { limit: 1001 };
      
      expect(() => validateProductListParams(invalidParams)).toThrow();
    });

    it('should reject negative offset', () => {
      const invalidParams = { offset: -1 };
      
      expect(() => validateProductListParams(invalidParams)).toThrow();
    });

    it('should accept empty parameters', () => {
      expect(() => validateProductListParams({})).not.toThrow();
    });
  });
});