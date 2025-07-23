# 🔐 Production Secrets Management

## Overview
Secure secret injection system for TUPÁ Hub production environment using Supabase Edge Functions.

## Architecture

```
Frontend App → Supabase Edge Function → Supabase Secrets → Cached Response
     ↓              ↓                        ↓               ↓
  Validation    Secret Resolution       Environment      In-Memory Cache
   Request       + Security            Variables         (5 min TTL)
```

## 🚀 Quick Start

### 1. Validate Secrets Availability
```typescript
import { secretsManager } from '@/lib/secrets-client';

// Check if a secret is accessible
const isValid = await secretsManager.validateSecret('OPENAI_API_KEY');

// Validate multiple secrets
const results = await secretsManager.validateSecrets([
  'STRIPE_SECRET_KEY',
  'SENDGRID_API_KEY'
]);
```

### 2. Production Readiness Check
```typescript
import { ProductionSecrets } from '@/lib/secrets-client';

const status = await ProductionSecrets.validateProduction();
if (!status.ready) {
  console.error('Missing secrets:', status.missing);
}
```

## 🔒 Security Features

### 1. **No Secret Values in Logs**
- Only logs secret names and validation status
- Never exposes actual secret values
- Sanitized error messages

### 2. **Input Validation**
- Secret names must match: `^[A-Z_][A-Z0-9_]*$`
- Prevents injection attacks
- Validates request format

### 3. **Secure Caching**
- In-memory cache (default 5 minutes)
- Automatic cleanup of expired entries
- Cache statistics for monitoring

### 4. **Production Monitoring**
```typescript
// Health monitoring
await ProductionSecrets.monitorSecrets();

// Expected output:
// 🔐 Secrets Health Check: {
//   endpoint: '✅ Online',
//   production: '✅ Ready',
//   missing: [],
//   timestamp: '2024-01-01T00:00:00.000Z'
// }
```

## 📋 Required Secrets

### Core System
- `SUPABASE_SERVICE_ROLE_KEY` - Database access
- `SUPABASE_DB_URL` - Direct database connection

### AI Services
- `OPENAI_API_KEY` - ChatGPT integration

### Communications
- `RESEND_API_KEY` - Email delivery

### Payment Processing (Optional)
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_WEBHOOK_SECRET` - Webhook validation

## 🔧 Configuration

### Setting Secrets
1. Go to [Supabase Dashboard → Functions → Secrets](https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/settings/functions)
2. Add each secret with exact name
3. Validate using the secrets manager

### Cache Configuration
```typescript
// Custom cache TTL (in seconds)
await secretsManager.validateSecret('MY_SECRET', 600); // 10 minutes

// Default: 300 seconds (5 minutes)
await secretsManager.validateSecret('MY_SECRET');
```

## 🚨 Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Secret not found` | Not configured in Supabase | Add secret in Dashboard |
| `Invalid secret name` | Wrong naming format | Use UPPER_SNAKE_CASE |
| `Internal server error` | Edge function issue | Check function logs |

### Error Response Format
```typescript
{
  success: false,
  error: "Secret 'INVALID_NAME' not configured in Supabase",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## 📊 Monitoring & Debugging

### Cache Statistics
Edge function logs cache stats every minute:
```
📊 Secret cache stats: 3/5 valid entries
```

### Access Logging
```
✅ Secret resolved and cached: OPENAI_API_KEY (TTL: 300s)
✅ Secret cache hit: OPENAI_API_KEY (expires in 245s)
```

## 🔗 Edge Function Endpoint

**Function:** `secure-secrets-manager`  
**Method:** POST  
**Payload:**
```json
{
  "secret_name": "OPENAI_API_KEY",
  "cache_ttl": 300
}
```

**Response:**
```json
{
  "success": true,
  "cached": false,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🛡️ Best Practices

1. **Never Log Secret Values** - Only log names and validation status
2. **Use Caching** - Reduces API calls and improves performance
3. **Monitor Regularly** - Run production checks in CI/CD
4. **Validate on Deploy** - Ensure all secrets are available before deployment
5. **Rotate Secrets** - Invalidate cache when rotating secrets

## 🔍 Troubleshooting

### Health Check
```typescript
const healthy = await secretsManager.healthCheck();
if (!healthy) {
  console.error('🚨 Secrets manager is not responding');
}
```

### Production Validation
```typescript
const { ready, missing } = await ProductionSecrets.validateProduction();
if (!ready) {
  throw new Error(`Missing production secrets: ${missing.join(', ')}`);
}
```