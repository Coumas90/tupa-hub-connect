# POS Integration Structure

This directory contains the refactored POS integration system for TupaHub, providing a clean, modular architecture for connecting to various Point of Sale systems.

## Architecture Overview

```
src/integrations/pos/
├── fudo/                    # Fudo POS integration
│   ├── types.ts            # Type definitions
│   ├── client.ts           # API client
│   ├── mapper.ts           # Data transformation
│   └── service.ts          # Service layer
├── bistrosoft/              # Bistrosoft POS integration  
│   ├── types.ts            # Type definitions
│   ├── client.ts           # API client
│   ├── mapper.ts           # Data transformation
│   └── service.ts          # Service layer
├── registry.ts              # POS adapter registry
└── sync.ts                 # Base sync functionality
```

## Key Components

### 1. Types (`types.ts`)
Defines interfaces for:
- Raw POS data structures
- API configurations
- Standardized Tupa data format
- API response formats

### 2. Client (`client.ts`)
Handles:
- HTTP communication with POS APIs
- Authentication and request management
- Connection validation
- Feature detection

### 3. Mapper (`mapper.ts`)
Provides:
- Data transformation from POS format to Tupa standard
- Data validation and integrity checks
- Timestamp normalization
- Customer insights extraction

### 4. Service (`service.ts`)
Orchestrates:
- High-level sync operations
- Error handling and logging
- Integration metadata management
- Feature-specific functionality

### 5. Registry (`registry.ts`)
Manages:
- POS adapter registration
- Factory functions for adapter creation
- Feature and capability discovery
- Version management

### 6. Sync (`sync.ts`)
Implements:
- Base sync service class
- Batch processing capabilities
- Progress tracking
- Error recovery

## Usage Examples

### Basic Sync Operation
```typescript
import { createSyncService } from '@/integrations/pos/sync';

const syncService = createSyncService({
  clientId: 'client-123',
  posType: 'fudo',
  posConfig: {
    apiUrl: 'https://api.fudo.com',
    apiKey: 'your-api-key'
  }
});

const result = await syncService.sync();
```

### Direct Adapter Usage
```typescript
import { getPOSAdapter } from '@/integrations/pos/registry';

const adapter = getPOSAdapter('bistrosoft', {
  apiUrl: 'https://api.bistrosoft.com',
  apiKey: 'your-api-key',
  storeId: 'store-456'
});

const sales = await adapter.fetchSales('client-123', {
  from: '2024-01-01T00:00:00Z',
  to: '2024-01-02T00:00:00Z'
});
```

### Getting Available POS Types
```typescript
import { getAvailablePOSTypes } from '@/integrations/pos/registry';

const posTypes = getAvailablePOSTypes();
// Returns: [{ type: 'fudo', name: 'Fudo POS', version: '1.0.0', ... }]
```

## Supported POS Systems

### Fudo POS
- **Features**: Real-time updates, customer data, table service, modifiers
- **Data Format**: JSON
- **Real-time**: Yes
- **Batch Limit**: 1000 records

### Bistrosoft POS  
- **Features**: Customer data, table service, discount handling, tax reporting
- **Data Format**: JSON
- **Real-time**: No
- **Batch Limit**: 500 records
- **Pagination**: Supported

## Data Flow

1. **Configuration** - POS credentials and settings loaded from client config
2. **Validation** - Connection to POS system verified
3. **Fetching** - Sales data retrieved from POS API
4. **Mapping** - Raw data transformed to standardized Tupa format
5. **Processing** - Data stored and synchronized with external systems
6. **Logging** - Operations logged for monitoring and debugging

## Error Handling

The system implements comprehensive error handling:
- Connection timeout management
- Retry logic with exponential backoff
- Circuit breaker pattern for failing systems
- Detailed error logging and metrics
- Graceful degradation for partial failures

## Extension Points

To add a new POS integration:

1. Create new directory: `src/integrations/pos/[pos-name]/`
2. Implement the four core files: `types.ts`, `client.ts`, `mapper.ts`, `service.ts`
3. Register in `registry.ts`
4. Update documentation

## Legacy Compatibility

The refactored system maintains compatibility with existing code through:
- Legacy registry exports in `src/integrations/pos/pos.registry.ts`
- Adapter interface compatibility
- Backward-compatible sync results

## Migration Notes

- Old files in `src/lib/integrations/pos/` are now deprecated
- Use `src/integrations/pos/registry.ts` instead of `src/lib/integrations/pos/pos.registry.ts`
- New sync service provides enhanced functionality over `sync.core.ts`