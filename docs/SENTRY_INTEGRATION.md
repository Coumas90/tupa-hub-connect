# Sentry Integration Setup

This document outlines the Sentry error tracking integration implemented in the TupaHub Connect application.

## Configuration

### DSN Setup
1. Create a Sentry account at https://sentry.io
2. Create a new React project in Sentry
3. Copy your DSN from the Sentry dashboard
4. Replace the placeholder DSN in `src/lib/sentry.ts`:
   ```typescript
   dsn: 'https://your-actual-dsn@sentry.io/your-project-id'
   ```

### Features Enabled

#### 1. Error Tracking
- **Unhandled Exceptions**: Automatically captures JavaScript errors
- **Unhandled Promise Rejections**: Captures async errors
- **Resource Loading Errors**: Captures failed asset loads
- **React Error Boundaries**: Custom error boundary with user-friendly fallback

#### 2. Session Replay (10% Sample Rate)
- Records 10% of user sessions for debugging
- Records 100% of sessions with errors
- Masks sensitive inputs automatically
- Excludes sensitive headers (Authorization tokens)

#### 3. Performance Monitoring
- Browser tracing integration
- 10% transaction sampling rate
- Tracks navigation and user interactions
- Monitors API calls to Supabase and other services

#### 4. Data Privacy
- Filters sensitive information before sending to Sentry
- Masks all input fields in session replays
- Removes Authorization headers from error reports
- Excludes localhost errors in development mode

## Implementation Details

### Initialization
```typescript
// Early initialization in main.tsx
import { initializeSentry } from '@/lib/sentry'
initializeSentry();
```

### Error Boundary
```typescript
// Wraps entire app in App.tsx
import { SentryErrorBoundary } from '@/lib/sentry'

<SentryErrorBoundary>
  {/* App content */}
</SentryErrorBoundary>
```

### Manual Error Tracking
```typescript
import { sentryUtils } from '@/lib/sentry'

// Capture custom errors
sentryUtils.captureError(error, { context: 'payment-processing' });

// Capture messages
sentryUtils.captureMessage('Payment completed', 'info');

// Add breadcrumbs
sentryUtils.addBreadcrumb('User clicked payment button', 'user-action');

// Set user context
sentryUtils.setUser({ id: user.id, email: user.email });
```

## Integration with Existing Error Handling

The Sentry integration works alongside existing error handling:
- **Auth errors**: Already integrated in `authConfig.ts` and `authGuard.ts`
- **Payment errors**: Can be enhanced with Sentry tracking
- **POS integration errors**: Automatic capture of network failures

## Environment Configuration

| Environment | Features |
|-------------|----------|
| Development | - Full error capture<br>- Localhost errors filtered<br>- Debug info in error boundary |
| Production | - Error capture<br>- Session replays<br>- Performance monitoring<br>- User-friendly error messages |

## Monitoring and Alerts

Configure Sentry alerts for:
- High error rates
- New error types
- Performance degradation
- User experience issues

## Privacy and Compliance

- No sensitive user data is sent to Sentry
- Input fields are masked in session replays
- Authorization tokens are filtered from error reports
- GDPR/privacy compliant configuration

## Testing Error Tracking

### Test Scenarios
1. **Unhandled Exception**: `throw new Error('Test error')`
2. **Promise Rejection**: `Promise.reject('Test rejection')`
3. **React Error**: Component that throws during render
4. **Network Error**: Failed API request

### Verification
1. Check Sentry dashboard for captured errors
2. Verify session replays are recording (for 10% of sessions)
3. Confirm performance transactions are being tracked
4. Test error boundary fallback UI

## Troubleshooting

### Common Issues
1. **DSN not configured**: Replace placeholder DSN with actual project DSN
2. **No errors appearing**: Check network connectivity and DSN validity
3. **Too many errors**: Adjust sample rates in configuration
4. **Performance impact**: Monitor bundle size and runtime performance

### Debug Mode
Enable debug mode in development:
```typescript
Sentry.init({
  // ... other config
  debug: import.meta.env.DEV,
});
```
