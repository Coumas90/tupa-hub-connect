import React from 'react';
import { useAuthFlowValidator } from '@/hooks/useAuthFlowValidator';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  User, 
  Shield,
  Database,
  Route,
  Activity
} from 'lucide-react';

/**
 * Comprehensive dashboard for monitoring authentication flow health
 * Provides real-time testing and validation of auth system
 */
export function AuthFlowDashboard() {
  const { 
    isRunning, 
    results, 
    overallHealth, 
    runFlowValidation 
  } = useAuthFlowValidator();

  const { 
    session, 
    user, 
    userRole, 
    isAdmin, 
    loading,
    getSessionTimeLeft,
    isSessionExpired 
  } = useOptimizedAuth();

  const sessionTimeLeft = getSessionTimeLeft();
  const sessionMinutesLeft = Math.floor(sessionTimeLeft / 1000 / 60);
  const sessionProgress = Math.max(0, sessionTimeLeft / (60 * 60 * 1000)); // Assuming 1 hour session

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTestIcon = (testName: string) => {
    switch (testName.toLowerCase()) {
      case 'session validity': return <Clock className="h-4 w-4" />;
      case 'role assignment': return <User className="h-4 w-4" />;
      case 'database connectivity': return <Database className="h-4 w-4" />;
      case 'session refresh': return <RefreshCw className="h-4 w-4" />;
      case 'redirect logic': return <Route className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon(overallHealth)}
              Estado del Sistema de Autenticación
            </CardTitle>
            <Badge variant={overallHealth === 'healthy' ? 'default' : overallHealth === 'warning' ? 'secondary' : 'destructive'}>
              {overallHealth.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Session Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sesión</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Tiempo restante</span>
                  <span className={isSessionExpired() ? 'text-red-600' : sessionMinutesLeft < 5 ? 'text-yellow-600' : 'text-green-600'}>
                    {sessionMinutesLeft}min
                  </span>
                </div>
                <Progress value={sessionProgress * 100} className="h-1" />
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Usuario</span>
              </div>
              <div className="text-xs text-muted-foreground">
                <div>Rol: {userRole || 'No asignado'}</div>
                <div>Admin: {isAdmin ? 'Sí' : 'No'}</div>
              </div>
            </div>

            {/* Auth Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Estado Auth</span>
              </div>
              <div className="flex items-center gap-1">
                {loading ? (
                  <Badge variant="secondary">Cargando...</Badge>
                ) : session ? (
                  <Badge variant="default">Autenticado</Badge>
                ) : (
                  <Badge variant="destructive">No autenticado</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resultados de Validación</CardTitle>
            <Button 
              onClick={runFlowValidation}
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Ejecutando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Ejecutar Pruebas
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay resultados de pruebas disponibles</p>
              <p className="text-sm">Haz clic en "Ejecutar Pruebas" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {getTestIcon(result.test)}
                    <div>
                      <div className="font-medium text-sm">{result.test}</div>
                      {result.error && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <span className="text-xs text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Pruebas ejecutadas</div>
              <div className="text-2xl font-bold">{results.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pruebas exitosas</div>
              <div className="text-2xl font-bold text-green-600">
                {results.filter(r => r.passed).length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Tiempo promedio</div>
              <div className="text-2xl font-bold">
                {results.length > 0 
                  ? Math.round(results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length)
                  : 0}ms
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Tasa de éxito</div>
              <div className="text-2xl font-bold">
                {results.length > 0 
                  ? Math.round((results.filter(r => r.passed).length / results.length) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}