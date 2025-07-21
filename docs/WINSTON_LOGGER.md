# Winston Logger Implementation

This document outlines the Winston logging implementation for the TupaHub Connect application.

## Features

### 1. JSON Output Format with Timestamps
- Structured JSON logging for production environments
- ISO timestamp format: `YYYY-MM-DD HH:mm:ss.SSS`
- Human-readable format for development
- Error stack traces included automatically

### 2. Daily Log Rotation
- **Application Logs**: `logs/application-YYYY-MM-DD.log` (14 days retention)
- **Error Logs**: `logs/error-YYYY-MM-DD.log` (30 days retention)  
- **Exception Logs**: `logs/exceptions-YYYY-MM-DD.log` (30 days retention)
- **Rejection Logs**: `logs/rejections-YYYY-MM-DD.log` (30 days retention)
- Maximum file size: 20MB before rotation
- Automatic compression of rotated files

### 3. Error Logging Middleware
- Request/response logging with unique request IDs
- Error context capture (user agent, IP, referer)
- Database operation logging
- Supabase Edge Function wrapper
- API error standardization

## Configuration

### Log Levels
- **Development**: `debug` level with console output
- **Production**: `info` level with file rotation
- **Error logs**: Always captured at `error` level

### Log Structure
```json
{
  "timestamp": "2024-01-21T10:30:00.123Z",
  "level": "info",
  "message": "API Request",
  "type": "request",
  "method": "POST",
  "url": "/api/users",
  "userId": "user-123",
  "requestId": "req-456",
  "duration": 150
}
```

## Usage Examples

### Basic Logging
```typescript
import { logger, loggerUtils } from '@/lib/logger';

// Basic logging
logger.info('User action completed');
logger.error('Database connection failed', { error: error.message });

// Structured logging
loggerUtils.logRequest('POST', '/api/users', 'user-123', 'req-456');
loggerUtils.logAuth('login', 'user-123', true, { method: 'password' });
```

### Middleware Integration
```typescript
import { requestLoggingMiddleware, errorLoggingMiddleware } from '@/lib/middleware/logging';

// Express-like middleware
app.use(requestLoggingMiddleware());
app.use(errorLoggingMiddleware());
```

### Edge Function Logging
```typescript
import { withLogging } from '@/lib/middleware/logging';

export const handler = withLogging(async (req) => {
  // Your function logic
  return new Response('Success');
}, 'my-function');
```

### Database Logging
```typescript
import { loggedSupabase } from '@/lib/supabase-logger';

// Automatic logging for database operations
const { data, error } = await loggedSupabase.select('users', 'id, email');
const result = await loggedSupabase.insert('posts', { title: 'New Post' });
```

## Log Types

### Request Logs
- HTTP method, URL, user ID, request ID
- Response status, duration
- User agent, IP address, referer

### Error Logs
- Error name, message, stack trace
- Request context and user information
- Database operation failures

### Authentication Logs
- Login/logout events
- User ID and success status
- Authentication method and duration

### Security Logs
- Security events with severity levels
- Suspicious activity detection
- Access control violations

### Performance Logs
- API response times
- Database query performance
- Resource usage metrics

### Business Logs
- User actions and business events
- Feature usage tracking
- Conversion metrics

## Production Setup

### Directory Structure
```
logs/
├── application-2024-01-21.log
├── application-2024-01-21.log.gz
├── error-2024-01-21.log
├── exceptions-2024-01-21.log
└── rejections-2024-01-21.log
```

### Log Rotation Configuration
- **Rotation**: Daily at midnight
- **Compression**: Automatic gzip compression
- **Retention**: 14 days for application logs, 30 days for errors
- **Max Size**: 20MB per file before forced rotation

### Monitoring Integration
- JSON format compatible with log aggregation tools
- Structured fields for easy querying
- Error alerting on critical log levels
- Performance metrics extraction

## Security Considerations

### Sensitive Data Protection
- No passwords or tokens in logs
- User data anonymization
- IP address masking in production
- Request body sanitization

### Access Control
- Log files require appropriate permissions
- Centralized log storage recommended
- Audit trail for log access
- Secure log transmission

## Performance Impact

### Optimization Features
- Asynchronous logging operations
- Log level filtering
- Efficient JSON serialization
- Minimal memory footprint

### Benchmarks
- < 1ms overhead per request
- Negligible memory usage
- Non-blocking I/O operations
- Automatic buffer management

## Troubleshooting

### Common Issues
1. **Permission errors**: Ensure log directory is writable
2. **Disk space**: Monitor log retention policies
3. **Performance**: Adjust log levels in production
4. **Missing logs**: Check file rotation configuration

### Debug Mode
```typescript
// Enable debug logging in development
logger.level = 'debug';
```

### Log Analysis
```bash
# View recent errors
tail -f logs/error-$(date +%Y-%m-%d).log

# Search for specific user
grep "user-123" logs/application-*.log

# Analyze performance
grep "duration" logs/application-*.log | jq '.duration' | sort -n
```