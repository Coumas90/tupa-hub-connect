import { FudoService } from './fudo/service';
import { BistrosoftService } from './bistrosoft/service';
import { TupaSalesData } from './fudo/types'; // Using common types

// POS Adapter Interface
export interface POSAdapter {
  name: string;
  version: string;
  fetchSales: (clientId: string, dateRange: { from: string; to: string }) => Promise<TupaSalesData[]>;
  mapToTupa: (rawData: any) => TupaSalesData[];
  validateConnection: () => Promise<boolean>;
  getLastSync?: () => Promise<string | null>;
  getSupportedFeatures?: () => string[];
  getMetadata?: () => any;
}

// Registry configuration interface
export interface POSRegistryConfig {
  service: any; // Service class constructor
  createAdapter: (config: any) => POSAdapter;
  version: string;
  features: string[];
  metadata: {
    name: string;
    provider: string;
    dataFormat: string;
    realTimeSupported: boolean;
    batchSizeLimit: number;
    paginationSupported?: boolean;
  };
}

// Factory functions for creating service instances
export const createFudoAdapter = (config: any): POSAdapter => {
  const service = new FudoService(config);
  return {
    name: 'Fudo POS',
    version: '1.0.0',
    fetchSales: service.fetchSales.bind(service),
    mapToTupa: service.mapToTupa.bind(service),
    validateConnection: service.validateConnection.bind(service),
    getLastSync: service.getLastSync.bind(service),
    getSupportedFeatures: service.getSupportedFeatures.bind(service),
    getMetadata: service.getMetadata.bind(service)
  };
};

export const createBistrosoftAdapter = (config: any): POSAdapter => {
  const service = new BistrosoftService(config);
  return {
    name: 'Bistrosoft POS',
    version: '1.0.0',
    fetchSales: service.fetchSales.bind(service),
    mapToTupa: service.mapToTupa.bind(service),
    validateConnection: service.validateConnection.bind(service),
    getLastSync: service.getLastSync.bind(service),
    getSupportedFeatures: service.getSupportedFeatures.bind(service),
    getMetadata: service.getMetadata.bind(service)
  };
};

// Centralized POS Registry
export const posRegistry: Record<string, POSRegistryConfig> = {
  'fudo': {
    service: FudoService,
    createAdapter: createFudoAdapter,
    version: '1.0.0',
    features: ['sales_sync', 'real_time_updates', 'customer_data', 'item_modifiers', 'table_service', 'waiter_tracking'],
    metadata: {
      name: 'Fudo POS',
      provider: 'fudo',
      dataFormat: 'json',
      realTimeSupported: true,
      batchSizeLimit: 1000
    }
  },
  'bistrosoft': {
    service: BistrosoftService,
    createAdapter: createBistrosoftAdapter,
    version: '1.0.0',
    features: ['sales_sync', 'customer_data', 'table_service', 'discount_handling', 'waiter_tracking', 'tax_reporting'],
    metadata: {
      name: 'Bistrosoft POS',
      provider: 'bistrosoft',
      dataFormat: 'json',
      realTimeSupported: false,
      batchSizeLimit: 500,
      paginationSupported: true
    }
  }
};

// Helper function to get a configured POS adapter
export function getPOSAdapter(posType: string, config: any): POSAdapter {
  const posConfig = posRegistry[posType];
  if (!posConfig) {
    throw new Error(`POS adapter not found for type: ${posType}`);
  }
  
  return posConfig.createAdapter(config);
}

// Helper function to list available POS types
export function getAvailablePOSTypes(): Array<{
  type: string;
  name: string;
  version: string;
  features: string[];
  metadata: any;
}> {
  return Object.entries(posRegistry).map(([type, config]) => ({
    type,
    name: config.metadata.name,
    version: config.version,
    features: config.features,
    metadata: config.metadata
  }));
}

// Helper function to validate POS type
export function isValidPOSType(posType: string): boolean {
  return posType in posRegistry;
}

// Helper function to get POS features
export function getPOSFeatures(posType: string): string[] {
  const posConfig = posRegistry[posType];
  return posConfig ? posConfig.features : [];
}

// Export for legacy compatibility with existing sync.core.ts
export const legacyPosRegistry = {
  fudo: { version: 'v1', adapter: { mapToTupa: (data: any) => createFudoAdapter({}).mapToTupa(data) } },
  bistrosoft: { version: 'v1', adapter: { mapToTupa: (data: any) => createBistrosoftAdapter({}).mapToTupa(data) } }
};