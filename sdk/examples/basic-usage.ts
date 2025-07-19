/**
 * Basic usage examples for TUPÁ Hub SDK
 */
import { 
  TupaHubClient, 
  createLogger, 
  LoggerProviders,
  validateSalePayload,
  type SalePayload,
  type ClientPayload 
} from '../index';

// Example 1: Basic client setup
async function basicSetup() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key-here',
    endpoint: 'https://api.tupahub.com',
    timeout: 45000,
    maxRetries: 5
  });

  // Health check
  try {
    const health = await client.healthCheck();
    console.log('API Status:', health.data.status);
  } catch (error) {
    console.error('API health check failed:', error);
  }
}

// Example 2: Creating sales with validation
async function createSaleExample() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  const saleData: SalePayload = {
    id: `sale-${Date.now()}`,
    total: 156.75,
    date: new Date().toISOString(),
    clientId: 'customer-abc123',
    items: [
      {
        id: 'item-coffee-001',
        name: 'Café Americano Grande',
        quantity: 2,
        price: 45.50,
        category: 'hot-beverages'
      },
      {
        id: 'item-pastry-002', 
        name: 'Croissant de Mantequilla',
        quantity: 1,
        price: 65.75,
        category: 'pastries'
      }
    ],
    paymentMethod: 'credit-card',
    metadata: {
      cashierId: 'emp-456',
      location: 'store-downtown',
      promotion: 'loyalty-discount'
    }
  };

  try {
    // Validate before sending
    validateSalePayload(saleData);
    
    // Create sale
    const result = await client.createSale(saleData);
    console.log('Sale created successfully:', result.data.id);
    
    return result.data;
  } catch (error) {
    console.error('Sale creation failed:', error);
    throw error;
  }
}

// Example 3: Client management
async function manageClients() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  try {
    // Get existing client
    const existingClient = await client.getClient('customer-abc123');
    console.log('Found client:', existingClient.data.name);

    // Update client information
    const updatedClient = await client.updateClient('customer-abc123', {
      email: 'newemail@example.com',
      phone: '+52-555-1234567',
      metadata: {
        lastVisit: new Date().toISOString(),
        preferences: ['coffee', 'pastries']
      }
    });

    console.log('Client updated:', updatedClient.data);
  } catch (error) {
    console.error('Client management failed:', error);
  }
}

// Example 4: Product catalog
async function browseProducts() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  try {
    // Get all active beverages
    const beverages = await client.listProducts({
      category: 'beverages',
      active: true,
      limit: 50
    });

    console.log(`Found ${beverages.data.length} beverages:`);
    beverages.data.forEach(product => {
      console.log(`- ${product.name}: $${product.price}`);
    });

    // Get products for pagination
    const allProducts = await client.listProducts({
      limit: 100,
      offset: 0
    });

    console.log(`Total products (page 1): ${allProducts.data.length}`);
  } catch (error) {
    console.error('Product browsing failed:', error);
  }
}

// Example 5: Custom logging setup
function customLoggingExample() {
  // JSON logging for production
  const jsonLogger = createLogger(
    'ProductionApp', 
    'info', 
    LoggerProviders.json()
  );

  // Silent logging for testing
  const testLogger = createLogger(
    'TestSuite',
    'error',
    LoggerProviders.silent()
  );

  // Custom logging with external service
  const externalLogger = createLogger(
    'ExternalIntegration',
    'debug',
    LoggerProviders.custom((message, level, data) => {
      // Send to external logging service
      // sendToLoggingService({ message, level, data, timestamp: new Date() });
      console.log(`[EXTERNAL] ${level}: ${message}`, data);
    })
  );

  jsonLogger.info('Application started', { version: '1.0.0' });
  testLogger.error('Test failed', { test: 'payment-flow' });
  externalLogger.debug('Debug info', { userId: '123', action: 'checkout' });
}

// Example 6: Error handling patterns
async function errorHandlingExample() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com'
  });

  const logger = createLogger('ErrorHandling');

  try {
    const sale = await client.createSale({
      id: 'invalid-sale',
      total: -100, // This will fail validation
      date: 'invalid-date',
      items: []
    } as SalePayload);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Sale creation failed', {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      });

      // Handle specific error types
      if (error.message.includes('validation')) {
        console.log('Data validation error - check your input');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('Network error - check connection and retry');
      } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
        console.log('Authentication error - check your API key');
      }
    }
  }
}

// Example 7: Retry and resilience patterns
async function resilienceExample() {
  const client = new TupaHubClient({
    apiKey: 'your-api-key',
    endpoint: 'https://api.tupahub.com',
    maxRetries: 5,
    timeout: 60000 // 1 minute timeout for slow networks
  });

  const logger = createLogger('Resilience');

  // Implement custom retry for business logic
  async function retryOperation<T>(
    operation: () => Promise<T>, 
    maxAttempts = 3, 
    delayMs = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(`Attempt ${attempt} failed`, { error });
        
        if (attempt === maxAttempts) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    
    throw new Error('Max attempts exceeded');
  }

  try {
    const result = await retryOperation(async () => {
      return await client.healthCheck();
    }, 3, 2000);
    
    logger.info('Health check succeeded', { status: result.data.status });
  } catch (error) {
    logger.error('All retry attempts failed', { error });
  }
}

// Export examples for testing/documentation
export {
  basicSetup,
  createSaleExample,
  manageClients,
  browseProducts,
  customLoggingExample,
  errorHandlingExample,
  resilienceExample
};

// Run examples (uncomment to test)
if (import.meta.main) {
  console.log('Running TUPÁ Hub SDK Examples...');
  
  // Note: These require a valid API key to run
  // await basicSetup();
  // await createSaleExample();
  // await manageClients();
  // await browseProducts();
  
  // These can run without API calls
  customLoggingExample();
  // await errorHandlingExample();
  // await resilienceExample();
}