import React, { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
  latency?: number;
  retryCount: number;
}

interface SmartRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export function useSmartRetry(options: SmartRetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  const [retryState, setRetryState] = useState({
    isRetrying: false,
    retryCount: 0,
    lastError: null as string | null,
    nextRetryIn: 0
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    lastChecked: new Date(),
    retryCount: 0
  });

  // Network status monitoring
  React.useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: true,
        lastChecked: new Date()
      }));
      toast({
        title: "🌐 Conexión Restaurada",
        description: "Tu conexión a internet se ha restablecido",
      });
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: false,
        lastChecked: new Date()
      }));
      toast({
        title: "📱 Sin Conexión",
        description: "Verifica tu conexión a internet",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const calculateDelay = (attempt: number): number => {
    const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

  const executeWithRetry = useCallback(async (
    operation: () => Promise<any>,
    context?: string
  ): Promise<any> => {
    setRetryState(prev => ({ 
      ...prev, 
      isRetrying: true, 
      lastError: null 
    }));

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check network before attempting
        if (!navigator.onLine) {
          throw new Error('Sin conexión a internet');
        }

        const result = await operation();
        
        // Success - reset retry state
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
          nextRetryIn: 0
        });

        if (attempt > 0) {
          toast({
            title: "✅ Operación Exitosa",
            description: `${context || 'Operación'} completada tras ${attempt} reintentos`,
          });
        }

        return result;

      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === maxRetries;
        
        setRetryState(prev => ({
          ...prev,
          retryCount: attempt + 1,
          lastError: lastError.message
        }));

        if (isLastAttempt) {
          setRetryState(prev => ({ ...prev, isRetrying: false }));
          
          toast({
            title: "❌ Error Persistente",
            description: `${context || 'Operación'} falló tras ${maxRetries + 1} intentos: ${lastError.message}`,
            variant: "destructive",
          });
          
          throw lastError;
        }

        // Calculate delay for next attempt
        const delay = calculateDelay(attempt);
        
        setRetryState(prev => ({ 
          ...prev, 
          nextRetryIn: Math.ceil(delay / 1000) 
        }));

        toast({
          title: `🔄 Reintento ${attempt + 1}/${maxRetries}`,
          description: `${context || 'Operación'} falló. Reintentando en ${Math.ceil(delay / 1000)}s...`,
        });

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, [maxRetries, baseDelay, maxDelay, backoffFactor]);

  const manualRetry = useCallback(async (operation: () => Promise<any>, context?: string) => {
    return executeWithRetry(operation, context);
  }, [executeWithRetry]);

  return {
    executeWithRetry,
    manualRetry,
    retryState,
    connectionStatus,
    isRetrying: retryState.isRetrying,
    canRetry: !retryState.isRetrying && connectionStatus.isOnline
  };
}

interface RetryStatusDisplayProps {
  retryState: any;
  connectionStatus: ConnectionStatus;
  onManualRetry?: () => void;
  className?: string;
}

export function RetryStatusDisplay({ 
  retryState, 
  connectionStatus, 
  onManualRetry,
  className 
}: RetryStatusDisplayProps) {
  const { isRetrying, retryCount, lastError, nextRetryIn } = retryState;
  const { isOnline, lastChecked } = connectionStatus;

  if (!lastError && !isRetrying && isOnline) {
    return null;
  }

  return (
    <Card className={cn("border-amber-200 dark:border-amber-800", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          {isRetrying ? (
            <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
          ) : !isOnline ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          
          <CardTitle className="text-sm">
            {isRetrying ? 'Reintentando...' : 
             !isOnline ? 'Sin Conexión' : 
             'Error de Conexión'}
          </CardTitle>
          
          {retryCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              Intento {retryCount}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estado de conexión:</span>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <span className={isOnline ? "text-green-600" : "text-red-600"}>
              {isOnline ? 'En línea' : 'Desconectado'}
            </span>
          </div>
        </div>

        {/* Last Error */}
        {lastError && (
          <Alert className="border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Retry Countdown */}
        {isRetrying && nextRetryIn > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Próximo intento en {nextRetryIn}s</span>
          </div>
        )}

        {/* Manual Retry Button */}
        {!isRetrying && isOnline && onManualRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onManualRetry}
            className="w-full"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Reintentar Ahora
          </Button>
        )}

        {/* Last Checked */}
        <div className="text-xs text-muted-foreground text-center">
          Última verificación: {lastChecked.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}