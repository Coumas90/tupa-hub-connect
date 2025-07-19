# TUPÁ Hub SDK

Official SDK for integrating with TUPÁ Hub API. Provides type-safe, robust connections to TUPÁ Hub services with built-in retry logic, error handling, and multi-provider support.

## Installation

```bash
npm install @tupa/hub-sdk
```

## Quick Start

```typescript
import { TupaHubClient } from '@tupa/hub-sdk';

const client = new TupaHubClient({
  apiKey: 'your-api-key',
  endpoint: 'https://api.tupahub.com',
  version: 'v1' // optional, defaults to 'v1'
});

// Create a sale
const saleData = {
  id: 'sale-123',
  total: 250.50,
  date: new Date().toISOString(),
  clientId: 'client-456',
  items: [
    {
      id: 'item-1',
      name: 'Café Americano',
      quantity: 2,
      price: 125.25,
      category: 'beverages'
    }
  ],
  paymentMethod: 'card'
};

const result = await client.createSale(saleData);
console.log('Sale created:', result.data);
```

## API Reference

### TupaHubClient

Main client class for TUPÁ Hub integration.

#### Constructor

```typescript
new TupaHubClient(config: TupaConfig)
```

**Config Options:**
- `apiKey` (string, required): Your TUPÁ Hub API key
- `endpoint` (string, required): TUPÁ Hub API endpoint URL
- `version` (string, optional): API version, defaults to 'v1'
- `timeout` (number, optional): Request timeout in milliseconds, defaults to 30000
- `maxRetries` (number, optional): Maximum retry attempts, defaults to 3

#### Methods

##### `createSale(salePayload: SalePayload): Promise<TupaResponse<SalePayload>>`

Creates a new sale record.

```typescript
const sale = await client.createSale({
  id: 'unique-sale-id',
  total: 100.50,
  date: '2024-01-15T10:30:00Z',
  clientId: 'customer-123',
  items: [
    {
      id: 'product-1',
      name: 'Café Latte',
      quantity: 1,
      price: 100.50
    }
  ]
});
```

##### `getClient(clientId: string): Promise<TupaResponse<ClientPayload>>`

Retrieves client information by ID.

```typescript
const client = await tupaClient.getClient('customer-123');
console.log(client.data.name, client.data.email);
```

##### `listProducts(params?: ProductListParams): Promise<TupaResponse<Product[]>>`

Lists available products with optional filtering.

```typescript
const products = await client.listProducts({
  category: 'beverages',
  active: true,
  limit: 50
});
```

##### `updateClient(clientId: string, clientData: Partial<ClientPayload>): Promise<TupaResponse<ClientPayload>>`

Updates client information.

```typescript
const updated = await client.updateClient('customer-123', {
  email: 'newemail@example.com',
  phone: '+1234567890'
});
```

##### `getSale(saleId: string): Promise<TupaResponse<SalePayload>>`

Retrieves sale information by ID.

```typescript
const sale = await client.getSale('sale-123');
```

##### `healthCheck(): Promise<TupaResponse<{status: string, timestamp: string}>>`

Checks API health status.

```typescript
const health = await client.healthCheck();
console.log('API Status:', health.data.status);
```

## Multi-Provider Support

The SDK supports multiple POS providers through adapters:

```typescript
import { TupaHubClient, FudoAdapter } from '@tupa/hub-sdk';

// Initialize client
const client = new TupaHubClient(config);

// Use Fudo adapter for POS integration
const fudoAdapter = new FudoAdapter({
  apiKey: 'fudo-api-key',
  baseUrl: 'https://api.fudo.com'
});

// Sync sales from Fudo to TUPÁ Hub
const syncResult = await fudoAdapter.syncSales(client);
```

### Available Adapters

- **FudoAdapter**: Integration with Fudo POS systems
- **BistrSoftAdapter**: Integration with BistrSoft POS systems (coming soon)

## Error Handling

The SDK provides comprehensive error handling:

```typescript
import { TupaHubError } from '@tupa/hub-sdk';

try {
  const result = await client.createSale(saleData);
} catch (error) {
  if (error instanceof TupaHubError) {
    console.error('TUPÁ Hub Error:', error.code, error.message);
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Logging

Configure custom logging:

```typescript
import { createLogger } from '@tupa/hub-sdk';

const logger = createLogger('MyApp', 'debug');
logger.info('Starting TUPÁ Hub integration');
```

### Log Levels

- `debug`: Detailed debugging information
- `info`: General information messages
- `warn`: Warning messages
- `error`: Error messages

## Type Definitions

The SDK is fully typed with TypeScript. Key types include:

- `SalePayload`: Sale data structure
- `ClientPayload`: Client information structure
- `Product`: Product information structure
- `TupaResponse<T>`: Standard API response wrapper
- `TupaError`: Error information structure

## Examples

### Complete Integration Example

```typescript
import { TupaHubClient, createLogger } from '@tupa/hub-sdk';

const logger = createLogger('POS-Integration');

class POSIntegration {
  private client: TupaHubClient;

  constructor(apiKey: string, endpoint: string) {
    this.client = new TupaHubClient({
      apiKey,
      endpoint,
      timeout: 45000,
      maxRetries: 5
    });
  }

  async syncDailySales(date: string) {
    try {
      logger.info('Starting daily sales sync', { date });

      // Get products for validation
      const products = await this.client.listProducts({ active: true });
      logger.info(`Found ${products.data.length} active products`);

      // Example sales data
      const salesData = [
        {
          id: `sale-${Date.now()}`,
          total: 150.75,
          date: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              name: 'Café Espresso',
              quantity: 3,
              price: 50.25
            }
          ]
        }
      ];

      // Create sales
      for (const sale of salesData) {
        const result = await this.client.createSale(sale);
        logger.info('Sale created successfully', { saleId: result.data.id });
      }

      logger.info('Daily sync completed successfully');
    } catch (error) {
      logger.error('Daily sync failed', { error });
      throw error;
    }
  }
}

// Usage
const integration = new POSIntegration(
  'your-api-key',
  'https://api.tupahub.com'
);

integration.syncDailySales('2024-01-15');
```

## Support

For technical support and documentation:
- GitHub Issues: [github.com/tupahub/sdk-issues](https://github.com/tupahub/sdk-issues)
- Documentation: [docs.tupahub.com](https://docs.tupahub.com)
- Email: sdk-support@tupahub.com

## License

MIT License - see LICENSE file for details.