/**
 * Custom error class for TUPÁ Hub SDK
 */
export class TupaHubError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    status?: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TupaHubError';
    this.code = code;
    this.status = status;
    this.details = details;

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TupaHubError);
    }
  }

  /**
   * Convert error to JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      status: this.status,
      details: this.details,
      stack: this.stack
    };
  }

  /**
   * Check if error is a network/connection error
   */
  isNetworkError(): boolean {
    return ['FETCH_ERROR', 'TIMEOUT_ERROR', 'NETWORK_ERROR'].includes(this.code);
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status ? this.status >= 400 && this.status < 500 : false;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status ? this.status >= 500 : false;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    if (this.isServerError()) return true;
    if (this.isNetworkError()) return true;
    if (this.status === 429) return true; // Rate limited
    return false;
  }
}

/**
 * Error codes used by the SDK
 */
export const ERROR_CODES = {
  // Configuration errors
  API_KEY_REQUIRED: 'API_KEY_REQUIRED',
  ENDPOINT_REQUIRED: 'ENDPOINT_REQUIRED',
  INVALID_CONFIG: 'INVALID_CONFIG',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  MAX_RETRIES_EXCEEDED: 'MAX_RETRIES_EXCEEDED',

  // HTTP errors
  HTTP_ERROR: 'HTTP_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',

  // Validation errors
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Business logic errors
  SALE_CREATION_FAILED: 'SALE_CREATION_FAILED',
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND'
} as const;