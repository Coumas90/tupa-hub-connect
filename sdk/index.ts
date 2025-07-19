/**
 * TUPÁ Hub SDK - Public API for third-party integrations
 * @version 1.1.0
 */

// Main client
export { TupaHubClient } from './tupahub.client';

// Types
export type { 
  SalePayload, 
  ClientPayload, 
  Product, 
  TupaConfig,
  TupaResponse,
  TupaError 
} from './types';

// Error handling
export { TupaHubError } from './utils/errors';

// Logging
export { 
  createLogger, 
  type Logger, 
  type LoggerProvider,
  type LogLevel,
  LoggerProviders,
  ConsoleLoggerProvider,
  SilentLoggerProvider,
  JSONLoggerProvider,
  globalLogger
} from './utils/logger';

// Validation schemas and utilities
export {
  validateSalePayload,
  validateClientPayload, 
  validateProduct,
  validateTupaConfig,
  validateProductListParams,
  safeParseSalePayload,
  safeParseClientPayload,
  safeParseProduct,
  safeParseTupaConfig,
  isSalePayload,
  isClientPayload,
  isProduct,
  type ValidatedSalePayload,
  type ValidatedClientPayload,
  type ValidatedProduct,
  type ValidatedTupaConfig,
  type ValidatedProductListParams
} from './schemas';

// Adapters and registry
export { FudoAdapter } from './adapters/fudo.adapter';
export { 
  AdapterRegistry, 
  adapterRegistry,
  registerDefaultAdapters,
  quickSync,
  type POSAdapter,
  type SyncResult,
  type AdapterConfig
} from './adapters/registry';