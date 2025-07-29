import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { productionGuard } from '@/lib/security/production-guard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SecurityViolation {
  type: 'warning' | 'error' | 'critical';
  message: string;
  code: string;
  recommendation: string;
}

export function SecurityStatusBadge() {
  const [securityScore, setSecurityScore] = useState(100);
  const [violations, setViolations] = useState<SecurityViolation[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const runAudit = () => {
      const detectedViolations = productionGuard.performSecurityAudit();
      const score = productionGuard.getSecurityScore();
      
      setViolations(detectedViolations);
      setSecurityScore(score);
    };

    runAudit();
    
    // Run audit periodically
    const interval = setInterval(runAudit, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  const getStatusVariant = () => {
    if (securityScore >= 90) return 'default';
    if (securityScore >= 70) return 'secondary';
    if (securityScore >= 50) return 'destructive';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (securityScore >= 90) return <Shield className="h-3 w-3" />;
    if (securityScore >= 50) return <AlertTriangle className="h-3 w-3" />;
    return <X className="h-3 w-3" />;
  };

  const criticalViolations = violations.filter(v => v.type === 'critical');
  const errorViolations = violations.filter(v => v.type === 'error');
  const warningViolations = violations.filter(v => v.type === 'warning');

  return (
    <div className="space-y-2">
      <Badge 
        variant={getStatusVariant()} 
        className="cursor-pointer flex items-center gap-1"
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        Security: {securityScore}/100
      </Badge>

      {showDetails && violations.length > 0 && (
        <div className="space-y-2 p-3 border rounded-lg bg-background">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Security Issues</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDetails(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {criticalViolations.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-destructive">Critical Issues</h5>
              {criticalViolations.map((violation, idx) => (
                <Alert key={idx} variant="destructive" className="p-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <strong>{violation.code}:</strong> {violation.message}
                    <br />
                    <em>{violation.recommendation}</em>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {errorViolations.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-orange-600">Errors</h5>
              {errorViolations.map((violation, idx) => (
                <Alert key={idx} className="p-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    <strong>{violation.code}:</strong> {violation.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {warningViolations.length > 0 && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-yellow-600">Warnings</h5>
              {warningViolations.map((violation, idx) => (
                <div key={idx} className="text-xs p-2 bg-yellow-50 rounded border">
                  <strong>{violation.code}:</strong> {violation.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}