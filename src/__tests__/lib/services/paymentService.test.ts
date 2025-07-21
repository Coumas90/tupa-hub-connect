import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PaymentService, { type PaymentData } from '@/lib/services/paymentService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Card Validation Edge Cases', () => {
    describe('validateCardNumber', () => {
      it('should validate correct Visa card numbers', () => {
        expect(paymentService.validateCardNumber('4242424242424242')).toBe(true);
        expect(paymentService.validateCardNumber('4111111111111111')).toBe(true);
      });

      it('should validate correct Mastercard numbers', () => {
        expect(paymentService.validateCardNumber('5555555555554444')).toBe(true);
        expect(paymentService.validateCardNumber('5105105105105100')).toBe(true);
      });

      it('should validate correct American Express numbers', () => {
        expect(paymentService.validateCardNumber('378282246310005')).toBe(true);
        expect(paymentService.validateCardNumber('371449635398431')).toBe(true);
      });

      it('should reject invalid card numbers', () => {
        expect(paymentService.validateCardNumber('4242424242424241')).toBe(false);
        expect(paymentService.validateCardNumber('1234567890123456')).toBe(false);
      });

      it('should handle edge cases', () => {
        // Too short
        expect(paymentService.validateCardNumber('123456789012')).toBe(false);
        
        // Too long
        expect(paymentService.validateCardNumber('12345678901234567890')).toBe(false);
        
        // Contains letters
        expect(paymentService.validateCardNumber('424242424242424a')).toBe(false);
        
        // Empty string
        expect(paymentService.validateCardNumber('')).toBe(false);
        
        // Null/undefined
        expect(paymentService.validateCardNumber(null as any)).toBe(false);
        expect(paymentService.validateCardNumber(undefined as any)).toBe(false);
        
        // With spaces (should be handled)
        expect(paymentService.validateCardNumber('4242 4242 4242 4242')).toBe(true);
        
        // With special characters
        expect(paymentService.validateCardNumber('4242-4242-4242-4242')).toBe(false);
      });

      it('should handle XSS attempts in card number', () => {
        expect(paymentService.validateCardNumber('<script>alert("xss")</script>')).toBe(false);
        expect(paymentService.validateCardNumber('4242424242424242<script>')).toBe(false);
      });
    });

    describe('validateExpiryDate', () => {
      beforeEach(() => {
        // Mock current date to January 2024
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should validate future dates', () => {
        expect(paymentService.validateExpiryDate('12/24')).toBe(true);
        expect(paymentService.validateExpiryDate('01/25')).toBe(true);
        expect(paymentService.validateExpiryDate('12/30')).toBe(true);
      });

      it('should reject past dates', () => {
        expect(paymentService.validateExpiryDate('12/23')).toBe(false);
        expect(paymentService.validateExpiryDate('01/20')).toBe(false);
      });

      it('should handle current month edge case', () => {
        expect(paymentService.validateExpiryDate('01/24')).toBe(true); // Current month
        expect(paymentService.validateExpiryDate('12/23')).toBe(false); // Previous month
      });

      it('should reject invalid formats', () => {
        expect(paymentService.validateExpiryDate('1/24')).toBe(false); // Single digit month
        expect(paymentService.validateExpiryDate('13/24')).toBe(false); // Invalid month
        expect(paymentService.validateExpiryDate('00/24')).toBe(false); // Zero month
        expect(paymentService.validateExpiryDate('12/2024')).toBe(false); // 4-digit year
        expect(paymentService.validateExpiryDate('12-24')).toBe(false); // Wrong separator
        expect(paymentService.validateExpiryDate('1224')).toBe(false); // No separator
        expect(paymentService.validateExpiryDate('')).toBe(false); // Empty
        expect(paymentService.validateExpiryDate('ab/cd')).toBe(false); // Letters
      });

      it('should handle XSS attempts in expiry date', () => {
        expect(paymentService.validateExpiryDate('<script>12/24</script>')).toBe(false);
        expect(paymentService.validateExpiryDate('12/24<script>')).toBe(false);
      });
    });

    describe('validateCVV', () => {
      it('should validate 3-digit CVV for non-Amex cards', () => {
        expect(paymentService.validateCVV('123', '4242424242424242')).toBe(true); // Visa
        expect(paymentService.validateCVV('456', '5555555555554444')).toBe(true); // Mastercard
        expect(paymentService.validateCVV('789', '6011111111111117')).toBe(true); // Discover
      });

      it('should validate 4-digit CVV for Amex cards', () => {
        expect(paymentService.validateCVV('1234', '378282246310005')).toBe(true);
        expect(paymentService.validateCVV('5678', '371449635398431')).toBe(true);
      });

      it('should reject wrong CVV length', () => {
        expect(paymentService.validateCVV('12', '4242424242424242')).toBe(false); // Too short for Visa
        expect(paymentService.validateCVV('1234', '4242424242424242')).toBe(false); // Too long for Visa
        expect(paymentService.validateCVV('123', '378282246310005')).toBe(false); // Too short for Amex
        expect(paymentService.validateCVV('12345', '378282246310005')).toBe(false); // Too long for Amex
      });

      it('should reject non-numeric CVV', () => {
        expect(paymentService.validateCVV('12a', '4242424242424242')).toBe(false);
        expect(paymentService.validateCVV('abc', '4242424242424242')).toBe(false);
        expect(paymentService.validateCVV('', '4242424242424242')).toBe(false);
      });

      it('should handle CVV without card number', () => {
        expect(paymentService.validateCVV('123')).toBe(true); // Defaults to 3-digit
        expect(paymentService.validateCVV('1234')).toBe(false); // 4-digit without Amex
      });
    });

    describe('getCardType', () => {
      it('should identify card types correctly', () => {
        expect(paymentService.getCardType('4242424242424242')).toBe('visa');
        expect(paymentService.getCardType('5555555555554444')).toBe('mastercard');
        expect(paymentService.getCardType('378282246310005')).toBe('amex');
        expect(paymentService.getCardType('6011111111111117')).toBe('discover');
        expect(paymentService.getCardType('1234567890123456')).toBe('unknown');
      });

      it('should handle edge cases', () => {
        expect(paymentService.getCardType('')).toBe('unknown');
        expect(paymentService.getCardType('4')).toBe('visa'); // Single digit Visa
        expect(paymentService.getCardType('4 242 424 242 424 242')).toBe('visa'); // With spaces
      });
    });

    describe('validatePaymentData', () => {
      const validPaymentData: PaymentData = {
        cardNumber: '4242424242424242',
        cardName: 'John Doe',
        expiryDate: '12/25',
        cvv: '123',
        billingAddress: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        amount: 99.99
      };

      it('should pass validation for valid data', () => {
        const errors = paymentService.validatePaymentData(validPaymentData);
        expect(errors).toHaveLength(0);
      });

      it('should catch multiple validation errors', () => {
        const invalidData: PaymentData = {
          cardNumber: '1234567890123456', // Invalid
          cardName: '', // Empty
          expiryDate: '13/20', // Invalid month and past year
          cvv: '12', // Too short
          billingAddress: '', // Empty
          city: 'New York',
          postalCode: '10001',
          amount: -10 // Negative
        };

        const errors = paymentService.validatePaymentData(invalidData);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.field === 'cardNumber')).toBe(true);
        expect(errors.some(e => e.field === 'cardName')).toBe(true);
        expect(errors.some(e => e.field === 'expiryDate')).toBe(true);
        expect(errors.some(e => e.field === 'cvv')).toBe(true);
        expect(errors.some(e => e.field === 'billingAddress')).toBe(true);
        expect(errors.some(e => e.field === 'amount')).toBe(true);
      });

      it('should validate minimum cardholder name length', () => {
        const dataWithShortName = { ...validPaymentData, cardName: 'J' };
        const errors = paymentService.validatePaymentData(dataWithShortName);
        expect(errors.some(e => e.field === 'cardName' && e.message.includes('at least 2 characters'))).toBe(true);
      });
    });
  });

  describe('Network Failure Rollback Tests', () => {
    const validPaymentData: PaymentData = {
      cardNumber: '4242424242424242',
      cardName: 'John Doe',
      expiryDate: '12/25',
      cvv: '123',
      billingAddress: '123 Main St',
      city: 'New York',
      postalCode: '10001',
      amount: 99.99
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should retry failed requests up to 3 times', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, transaction_id: 'txn_123' })
        });

      const resultPromise = paymentService.processPayment(validPaymentData);
      
      // Fast-forward through delays
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_123');
    });

    it('should not retry declined payments', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 402,
        json: () => Promise.resolve({
          message: 'Insufficient funds',
          decline_code: 'insufficient_funds'
        })
      });

      const result = await paymentService.processPayment(validPaymentData);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      expect(result.declineCode).toBe('insufficient_funds');
    });

    it('should perform rollback after all retries fail', async () => {
      mockFetch
        .mockRejectedValue(new Error('Network error'))
        .mockRejectedValue(new Error('Network error'))
        .mockRejectedValue(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true }); // Rollback call

      const resultPromise = paymentService.processPayment(validPaymentData);
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment processing failed after retries');
      
      // Verify rollback was called
      expect(mockFetch).toHaveBeenCalledWith('/api/payment/rollback', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining(validPaymentData.amount.toString())
      }));
    });

    it('should handle rollback failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFetch
        .mockRejectedValue(new Error('Network error')) // Payment attempts
        .mockRejectedValue(new Error('Network error'))
        .mockRejectedValue(new Error('Network error'))
        .mockRejectedValue(new Error('Rollback failed')); // Rollback failure

      const resultPromise = paymentService.processPayment(validPaymentData);
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to rollback payment:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle different HTTP error status codes', async () => {
      // Test 500 Internal Server Error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await paymentService.processPayment(validPaymentData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 500: Internal Server Error');
    });

    it('should handle malformed response data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const resultPromise = paymentService.processPayment(validPaymentData);
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should implement exponential backoff for retries', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;
      
      vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(callback, 0); // Execute immediately for testing
      });

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, transaction_id: 'txn_123' })
        });

      await paymentService.processPayment(validPaymentData);

      // Check that delays increase (exponential backoff)
      expect(delays).toEqual([1000, 2000]); // 1s, 2s delays
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete successful payment flow', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          transaction_id: 'txn_success_123'
        })
      });

      const paymentData: PaymentData = {
        cardNumber: '4242424242424242',
        cardName: 'Integration Test',
        expiryDate: '12/25',
        cvv: '123',
        billingAddress: '123 Test St',
        city: 'Test City',
        postalCode: '12345',
        amount: 50.00
      };

      const result = await paymentService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_success_123');
      expect(mockFetch).toHaveBeenCalledWith('/api/payment', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));
    });

    it('should sanitize all input data before processing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, transaction_id: 'txn_123' })
      });

      const paymentData: PaymentData = {
        cardNumber: '4242 4242 4242 4242',
        cardName: '<script>alert("xss")</script>John Doe',
        expiryDate: '12/25',
        cvv: '123',
        billingAddress: '123 Main St <script>',
        city: 'New York',
        postalCode: '10001',
        amount: 99.99
      };

      await paymentService.processPayment(paymentData);

      const callArgs = mockFetch.mock.calls[0][1];
      const sentData = JSON.parse(callArgs.body);
      
      expect(sentData.cardName).not.toContain('<script>');
      expect(sentData.billingAddress).not.toContain('<script>');
    });
  });
});