/**
 * TUPÁ Hub SDK - Public API for third-party integrations
 * @version 1.0.0
 */

export { TupaHubClient } from './tupahub.client';
export type { 
  SalePayload, 
  ClientPayload, 
  Product, 
  TupaConfig,
  TupaResponse,
  TupaError 
} from './types';
export { TupaHubError } from './utils/errors';
export { createLogger } from './utils/logger';

// Adapters
export { FudoAdapter } from './adapters/fudo.adapter';