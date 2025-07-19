/**
 * Multi-provider integration examples
 */
import { 
  TupaHubClient,
  FudoAdapter,
  AdapterRegistry,
  adapterRegistry,
  registerDefaultAdapters,
  quickSync,
  createLogger,
  type SyncResult,
  type AdapterConfig
} from '../index';

// Example 1: Basic multi-provider setup
async function basicMultiProviderSetup() {
  const logger = createLogger('MultiProvider');

  // Initialize TUPÁ Hub client
  const tupaClient = new TupaHubClient({
    apiKey: 'your-tupa-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  // Configure POS providers
  const providerConfigs: Record<string, AdapterConfig> = {
    fudo: {
      apiKey: 'fudo-api-key',
      baseUrl: 'https://api.fudo.com',
      timeout: 30000,
      retries: 3
    },
    // Add more providers as they become available
    // bistrosoft: {
    //   apiKey: 'bistrosoft-api-key',
    //   baseUrl: 'https://api.bistrosoft.com'
    // }
  };

  // Register adapters
  registerDefaultAdapters(providerConfigs);

  logger.info('Multi-provider setup complete', { 
    providers: Object.keys(providerConfigs)
  });

  return { tupaClient, providerConfigs };
}

// Example 2: Custom adapter registry management
async function customRegistryExample() {
  const logger = createLogger('CustomRegistry');
  const registry = new AdapterRegistry();

  // Create and register adapters manually
  const fudoAdapter = new FudoAdapter({
    apiKey: 'fudo-key',
    baseUrl: 'https://api.fudo.com'
  });

  registry.register(fudoAdapter);

  // List available adapters
  const adapters = registry.listAdapters();
  logger.info('Available adapters', { adapters });

  // Health check all adapters
  const healthResults = await registry.healthCheckAll();
  logger.info('Health check results', { healthResults });

  for (const [name, isHealthy] of Object.entries(healthResults)) {
    if (!isHealthy) {
      logger.warn(`Adapter ${name} is not healthy`);
    }
  }

  return registry;
}

// Example 3: Sync all providers
async function syncAllProvidersExample() {
  const logger = createLogger('SyncAll');

  const { tupaClient } = await basicMultiProviderSetup();

  try {
    // Sync all registered providers
    const syncResults = await adapterRegistry.syncAll(tupaClient);

    logger.info('Sync completed for all providers', { 
      totalProviders: Object.keys(syncResults).length 
    });

    // Process results
    for (const [providerName, result] of Object.entries(syncResults)) {
      if (result.success) {
        logger.info(`${providerName} sync successful`, {
          records: result.recordsProcessed,
          duration: result.details?.duration
        });
      } else {
        logger.error(`${providerName} sync failed`, {
          errors: result.errors,
          records: result.recordsProcessed
        });
      }
    }

    return syncResults;
  } catch (error) {
    logger.error('Sync all failed', { error });
    throw error;
  }
}

// Example 4: Individual provider sync with error handling
async function individualProviderSync() {
  const logger = createLogger('IndividualSync');

  const tupaClient = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  try {
    // Quick sync for specific provider
    const result = await quickSync('fudo', {
      apiKey: 'fudo-api-key',
      baseUrl: 'https://api.fudo.com'
    }, tupaClient);

    if (result.success) {
      logger.info('Fudo sync completed', {
        recordsProcessed: result.recordsProcessed,
        timestamp: result.timestamp
      });
    } else {
      logger.error('Fudo sync failed', {
        errors: result.errors,
        recordsProcessed: result.recordsProcessed
      });
    }

    return result;
  } catch (error) {
    logger.error('Individual sync failed', { provider: 'fudo', error });
    throw error;
  }
}

// Example 5: Scheduled sync with monitoring
class ScheduledSyncManager {
  private logger = createLogger('ScheduledSync');
  private syncInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private tupaClient: TupaHubClient,
    private intervalMinutes = 15
  ) {}

  start() {
    if (this.isRunning) {
      this.logger.warn('Scheduled sync already running');
      return;
    }

    this.logger.info('Starting scheduled sync', { 
      intervalMinutes: this.intervalMinutes 
    });

    this.isRunning = true;
    this.syncInterval = setInterval(
      () => this.performSync(),
      this.intervalMinutes * 60 * 1000
    );

    // Perform initial sync
    this.performSync();
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    this.isRunning = false;
    this.logger.info('Scheduled sync stopped');
  }

  private async performSync() {
    try {
      this.logger.info('Starting scheduled sync cycle');
      
      const startTime = Date.now();
      const results = await adapterRegistry.syncAll(this.tupaClient);
      const duration = Date.now() - startTime;

      // Calculate metrics
      const totalRecords = Object.values(results)
        .reduce((sum, result) => sum + result.recordsProcessed, 0);
      const failedProviders = Object.values(results)
        .filter(result => !result.success).length;

      this.logger.info('Scheduled sync completed', {
        duration,
        totalRecords,
        failedProviders,
        providersCount: Object.keys(results).length
      });

      // Alert on failures
      if (failedProviders > 0) {
        this.logger.warn('Some providers failed during sync', {
          failedCount: failedProviders,
          details: Object.entries(results)
            .filter(([_, result]) => !result.success)
            .map(([name, result]) => ({ name, errors: result.errors }))
        });
      }

    } catch (error) {
      this.logger.error('Scheduled sync cycle failed', { error });
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      adaptersCount: adapterRegistry.listAdapters().length
    };
  }
}

// Example 6: Provider-specific configuration and monitoring
async function providerMonitoringExample() {
  const logger = createLogger('ProviderMonitoring');

  const tupaClient = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  // Create monitoring dashboard data
  async function getProviderStatus() {
    const adapters = adapterRegistry.listAdapters();
    const healthResults = await adapterRegistry.healthCheckAll();

    const status = adapters.map(adapter => ({
      name: adapter.name,
      version: adapter.version,
      isHealthy: healthResults[adapter.name] || false,
      lastSync: null // Would come from persistence layer
    }));

    return status;
  }

  // Sync with detailed monitoring
  async function monitoredSync(providerName: string) {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting monitored sync for ${providerName}`);

      const adapter = adapterRegistry.getAdapter(providerName);
      if (!adapter) {
        throw new Error(`Adapter ${providerName} not found`);
      }

      const result = await adapter.syncSales(tupaClient);
      const duration = Date.now() - startTime;

      // Log detailed metrics
      logger.info(`Sync completed for ${providerName}`, {
        success: result.success,
        recordsProcessed: result.recordsProcessed,
        errors: result.errors.length,
        duration,
        throughput: result.recordsProcessed / (duration / 1000) // records per second
      });

      return { ...result, duration, provider: providerName };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Sync failed for ${providerName}`, { error, duration });
      throw error;
    }
  }

  // Example usage
  const status = await getProviderStatus();
  logger.info('Provider status', { status });

  for (const provider of status) {
    if (provider.isHealthy) {
      try {
        await monitoredSync(provider.name);
      } catch (error) {
        logger.error(`Failed to sync ${provider.name}`, { error });
      }
    } else {
      logger.warn(`Skipping sync for unhealthy provider: ${provider.name}`);
    }
  }
}

// Export examples
export {
  basicMultiProviderSetup,
  customRegistryExample,
  syncAllProvidersExample,
  individualProviderSync,
  ScheduledSyncManager,
  providerMonitoringExample
};

// Run examples (uncomment to test)
if (import.meta.main) {
  console.log('Running Multi-Provider Examples...');
  
  // Note: These require valid API keys
  // await basicMultiProviderSetup();
  // await customRegistryExample();
  // await syncAllProvidersExample();
  // await individualProviderSync();
  
  // Example of scheduled sync manager
  // const manager = new ScheduledSyncManager(tupaClient, 5); // 5 minute intervals
  // manager.start();
  // setTimeout(() => manager.stop(), 30000); // Stop after 30 seconds for demo
}