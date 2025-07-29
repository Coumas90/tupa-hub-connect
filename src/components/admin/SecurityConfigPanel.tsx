import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { SecurityStatusBadge } from '@/components/security/SecurityStatusBadge';

interface SecurityConfig {
  id: string;
  name: string;
  status: 'configured' | 'warning' | 'critical';
  description: string;
  dashboardUrl: string;
  instructions: string[];
}

export function SecurityConfigPanel() {
  const [configs] = useState<SecurityConfig[]>([
    {
      id: 'otp_expiry',
      name: 'OTP Expiry',
      status: 'warning',
      description: 'Password reset tokens expire too slowly (default 60 minutes)',
      dashboardUrl: 'https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/providers',
      instructions: [
        'Navigate to Authentication → Settings → Email',
        'Set "Email OTP expiry" to 600 seconds (10 minutes)',
        'Click Save to apply changes'
      ]
    },
    {
      id: 'leaked_password',
      name: 'Leaked Password Protection',
      status: 'warning',
      description: 'Protection against known leaked passwords is disabled',
      dashboardUrl: 'https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/providers',
      instructions: [
        'Navigate to Authentication → Settings → Password',
        'Enable "Leaked password protection"',
        'Save the configuration'
      ]
    },
    {
      id: 'rate_limiting',
      name: 'Auth Rate Limiting',
      status: 'warning',
      description: 'Authentication rate limits need configuration for production',
      dashboardUrl: 'https://supabase.com/dashboard/project/hmmaubkxfewzlypywqff/auth/providers',
      instructions: [
        'Navigate to Authentication → Settings → Rate limits',
        'Set Sign-in: 5 attempts per hour per IP',
        'Set Sign-up: 3 attempts per hour per IP',
        'Set Password reset: 3 attempts per hour per email'
      ]
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'configured': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Manual configuration required in Supabase Dashboard
          </p>
        </div>
        <SecurityStatusBadge />
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Manual Configuration Required:</strong> These security settings must be configured 
          in the Supabase Dashboard as they cannot be automated through the API.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(config.status)}
                  <CardTitle className="text-base">{config.name}</CardTitle>
                  <Badge variant={getStatusVariant(config.status)}>
                    {config.status}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(config.dashboardUrl, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Configure
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{config.description}</p>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Configuration Steps:</h4>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  {config.instructions.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Automated Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium">✅ Implemented</h4>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Security event logging</li>
                <li>• Rate limiting protection</li>
                <li>• Refresh token rotation</li>
                <li>• Session management</li>
                <li>• Production guards</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">✅ Enhanced Headers</h4>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• Content Security Policy</li>
                <li>• Cross-Origin Protection</li>
                <li>• XSS Protection</li>
                <li>• CSRF Protection</li>
                <li>• Security Headers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}