import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { initializeSentry } from '@/lib/sentry';

const SentryConfigurationCard: React.FC = () => {
  const [sentryStatus, setSentryStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');
  const [isReinitializing, setIsReinitializing] = useState(false);
  const { getSystemSetting, checkSentryConfiguration } = useSystemSettings();

  useEffect(() => {
    checkSentryStatus();
  }, []);

  const checkSentryStatus = async () => {
    setSentryStatus('checking');
    try {
      const isConfigured = await checkSentryConfiguration();
      setSentryStatus(isConfigured ? 'configured' : 'not-configured');
    } catch (error) {
      console.error('Error checking Sentry status:', error);
      setSentryStatus('not-configured');
    }
  };

  const reinitializeSentry = async () => {
    setIsReinitializing(true);
    try {
      await initializeSentry();
      await checkSentryStatus();
    } catch (error) {
      console.error('Error reinitializing Sentry:', error);
    } finally {
      setIsReinitializing(false);
    }
  };

  const getStatusBadge = () => {
    switch (sentryStatus) {
      case 'checking':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full"></div>
            Checking...
          </Badge>
        );
      case 'configured':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Configured
          </Badge>
        );
      case 'not-configured':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Not Configured
          </Badge>
        );
    }
  };

  const getStatusMessage = () => {
    switch (sentryStatus) {
      case 'checking':
        return 'Verifying Sentry configuration...';
      case 'configured':
        return 'Sentry is properly configured and active for error tracking and monitoring.';
      case 'not-configured':
        return 'Sentry DSN is set to the default warning value. Configure a valid DSN to enable error tracking.';
    }
  };

  const getAlertVariant = () => {
    return sentryStatus === 'not-configured' ? 'destructive' : 'default';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <CardTitle>Sentry Error Tracking</CardTitle>
              <CardDescription>Monitor application errors and performance</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={getAlertVariant()}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {getStatusMessage()}
          </AlertDescription>
        </Alert>

        {sentryStatus === 'not-configured' && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <p><strong>To configure Sentry:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Create a Sentry project at <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sentry.io</a></li>
                <li>Copy your project's DSN</li>
                <li>Update the system setting 'sentry_dsn' with your DSN</li>
                <li>Click "Test Configuration" to validate</li>
              </ol>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={checkSentryStatus}
            variant="outline"
            size="sm"
            disabled={sentryStatus === 'checking'}
          >
            <RefreshCw className={`h-4 w-4 ${sentryStatus === 'checking' ? 'animate-spin' : ''}`} />
            Check Status
          </Button>

          {sentryStatus === 'configured' && (
            <Button
              onClick={reinitializeSentry}
              variant="outline"
              size="sm"
              disabled={isReinitializing}
            >
              <RefreshCw className={`h-4 w-4 ${isReinitializing ? 'animate-spin' : ''}`} />
              {isReinitializing ? 'Reinitializing...' : 'Test Configuration'}
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Configuration Priority:</strong> Environment variable (VITE_SENTRY_DSN) → Database setting (system_settings.sentry_dsn)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SentryConfigurationCard;