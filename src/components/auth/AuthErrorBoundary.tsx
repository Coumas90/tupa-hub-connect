import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/browser';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `auth-error-${Date.now()}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 AuthErrorBoundary: Authentication error caught:', error, errorInfo);
    
    // Send to Sentry with auth context
    Sentry.withScope((scope) => {
      scope.setTag('component', 'AuthErrorBoundary');
      scope.setLevel('error');
      scope.setContext('error_info', {
        componentStack: errorInfo.componentStack,
        digest: errorInfo.digest || 'unknown',
      });
      scope.setContext('auth_error', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        retryCount: this.retryCount,
      });
      
      Sentry.captureException(error);
    });
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.info(`🔄 AuthErrorBoundary: Retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      this.setState({
        hasError: false,
        error: null,
        errorId: null,
      });
    } else {
      console.warn('🚨 AuthErrorBoundary: Max retries exceeded, redirecting to login');
      window.location.href = '/auth';
    }
  };

  handleReload = () => {
    console.info('🔄 AuthErrorBoundary: Full page reload requested');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isNetworkError = this.state.error?.message?.includes('Network') || 
                            this.state.error?.message?.includes('fetch');
      const isAuthError = this.state.error?.message?.includes('auth') ||
                         this.state.error?.message?.includes('session');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-background/80">
          <Card className="w-full max-w-md border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Error de Autenticación</CardTitle>
              <CardDescription>
                {isNetworkError 
                  ? "Problema de conexión detectado"
                  : isAuthError 
                    ? "Error en el sistema de autenticación"
                    : "Ha ocurrido un error inesperado"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                <strong>Detalles técnicos:</strong><br />
                {this.state.error?.name}: {this.state.error?.message}
                <br />
                <span className="text-xs opacity-70">ID: {this.state.errorId}</span>
              </div>

              <div className="flex flex-col gap-2">
                {this.retryCount < this.maxRetries ? (
                  <Button 
                    onClick={this.handleRetry} 
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar ({this.maxRetries - this.retryCount} intentos restantes)
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/auth'} 
                    className="w-full"
                    variant="default"
                  >
                    Ir a Login
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload} 
                  variant="outline" 
                  className="w-full"
                >
                  Recargar Página
                </Button>
              </div>

              {isNetworkError && (
                <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-2 rounded border-l-4 border-blue-500">
                  <strong>💡 Sugerencia:</strong> Verifica tu conexión a internet e intenta nuevamente.
                </div>
              )}
              
              {isAuthError && (
                <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-2 rounded border-l-4 border-amber-500">
                  <strong>🔐 Ayuda:</strong> Si el problema persiste, contacta al soporte técnico.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}