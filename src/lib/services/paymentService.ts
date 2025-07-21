import { sanitizeInput } from '@/utils/sanitize';

export interface PaymentData {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  city: string;
  postalCode: string;
  amount: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  declineCode?: string;
}

export interface PaymentValidationError {
  field: string;
  message: string;
}

class PaymentService {
  private readonly API_ENDPOINT = '/api/payment';
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000;

  /**
   * Validates card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    const sanitized = sanitizeInput(cardNumber).replace(/\s/g, '');
    
    if (!/^\d{13,19}$/.test(sanitized)) {
      return false;
    }

    let sum = 0;
    let isEven = false;
    
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  /**
   * Validates expiry date
   */
  validateExpiryDate(expiryDate: string): boolean {
    const sanitized = sanitizeInput(expiryDate);
    const match = sanitized.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    
    if (!match) {
      return false;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }

    return true;
  }

  /**
   * Validates CVV code
   */
  validateCVV(cvv: string, cardNumber?: string): boolean {
    const sanitized = sanitizeInput(cvv);
    
    // American Express cards have 4-digit CVV
    const isAmex = cardNumber && this.getCardType(cardNumber) === 'amex';
    const expectedLength = isAmex ? 4 : 3;
    
    return new RegExp(`^\\d{${expectedLength}}$`).test(sanitized);
  }

  /**
   * Gets card type from card number
   */
  getCardType(cardNumber: string): string {
    const sanitized = sanitizeInput(cardNumber).replace(/\s/g, '');
    
    if (/^4/.test(sanitized)) return 'visa';
    if (/^5[1-5]/.test(sanitized)) return 'mastercard';
    if (/^3[47]/.test(sanitized)) return 'amex';
    if (/^6/.test(sanitized)) return 'discover';
    
    return 'unknown';
  }

  /**
   * Validates entire payment data
   */
  validatePaymentData(data: PaymentData): PaymentValidationError[] {
    const errors: PaymentValidationError[] = [];

    if (!data.cardNumber?.trim()) {
      errors.push({ field: 'cardNumber', message: 'Card number is required' });
    } else if (!this.validateCardNumber(data.cardNumber)) {
      errors.push({ field: 'cardNumber', message: 'Invalid card number' });
    }

    if (!data.cardName?.trim()) {
      errors.push({ field: 'cardName', message: 'Cardholder name is required' });
    } else if (data.cardName.trim().length < 2) {
      errors.push({ field: 'cardName', message: 'Cardholder name must be at least 2 characters' });
    }

    if (!data.expiryDate?.trim()) {
      errors.push({ field: 'expiryDate', message: 'Expiry date is required' });
    } else if (!this.validateExpiryDate(data.expiryDate)) {
      errors.push({ field: 'expiryDate', message: 'Invalid or expired date' });
    }

    if (!data.cvv?.trim()) {
      errors.push({ field: 'cvv', message: 'CVV is required' });
    } else if (!this.validateCVV(data.cvv, data.cardNumber)) {
      errors.push({ field: 'cvv', message: 'Invalid CVV code' });
    }

    if (!data.billingAddress?.trim()) {
      errors.push({ field: 'billingAddress', message: 'Billing address is required' });
    }

    if (data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }

    return errors;
  }

  /**
   * Processes payment with retry logic and rollback capability
   */
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    const validationErrors = this.validatePaymentData(data);
    
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors.map(e => e.message).join(', ')
      };
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await this.makePaymentRequest(data);
        
        if (result.success) {
          return result;
        } else if (result.declineCode) {
          // Don't retry declined payments
          return result;
        }
        
        lastError = new Error(result.error || 'Payment failed');
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }

    // Rollback any partial transaction state
    await this.rollbackPayment(data);

    return {
      success: false,
      error: lastError?.message || 'Payment processing failed after retries'
    };
  }

  /**
   * Makes the actual payment request
   */
  private async makePaymentRequest(data: PaymentData): Promise<PaymentResult> {
    const sanitizedData = {
      cardNumber: sanitizeInput(data.cardNumber),
      cardName: sanitizeInput(data.cardName),
      expiryDate: sanitizeInput(data.expiryDate),
      cvv: sanitizeInput(data.cvv),
      billingAddress: sanitizeInput(data.billingAddress),
      city: sanitizeInput(data.city),
      postalCode: sanitizeInput(data.postalCode),
      amount: data.amount
    };

    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    if (!response.ok) {
      if (response.status === 402) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Payment declined',
          declineCode: errorData.decline_code
        };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      transactionId: result.transaction_id
    };
  }

  /**
   * Rolls back payment in case of failure
   */
  private async rollbackPayment(data: PaymentData): Promise<void> {
    try {
      await fetch(`${this.API_ENDPOINT}/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: data.amount,
          timestamp: Date.now()
        }),
      });
    } catch (error) {
      console.error('Failed to rollback payment:', error);
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const paymentService = new PaymentService();
export default PaymentService;