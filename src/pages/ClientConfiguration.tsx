import { useState, useEffect } from 'react';
import { sanitizeInput } from '@/utils/FormUtils';
import { useParams, Link } from 'react-router-dom';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, TestTube, Activity, Settings, Eye } from 'lucide-react';
import { getAvailablePOSTypes } from '@/lib/integrations/pos/pos.registry';
import { integrationLogger } from '@/lib/integrations/logger';
import { syncClientPOS } from '@/lib/integrations/pos/sync.core';

interface ClientConfig {
  id: string;
  name: string;
  pos_type: string;
  simulation_mode: boolean;
  sync_frequency: number;
  api_key?: string;
  api_endpoint?: string;
  active: boolean;
  last_sync?: string;
  sync_status: 'ok' | 'error' | 'pending' | 'never';
  error_message?: string;
}

export default function ClientConfiguration() {
  const { clientId } = useParams<{ clientId: string }>();
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const availablePOSTypes = getAvailablePOSTypes();

  useEffect(() => {
    if (clientId) {
      loadClientConfig();
    }
  }, [clientId]);

  const loadClientConfig = async () => {
    // Mock data - en producción vendría de Supabase
    const mockConfigs: Record<string, ClientConfig> = {
      'client_001': {
        id: 'client_001',
        name: 'Café Central - Villa Urquiza',
        pos_type: 'fudo',
        simulation_mode: true,
        sync_frequency: 30,
        api_key: 'fudo_key_abc123***',
        api_endpoint: 'https://api.fudo.com.ar/v1',
        active: true,
        last_sync: '2024-01-19T10:30:00Z',
        sync_status: 'ok'
      },
      'client_002': {
        id: 'client_002',
        name: 'Bistro Norte - Palermo',
        pos_type: 'bistrosoft',
        simulation_mode: false,
        sync_frequency: 15,
        api_key: 'bistro_secure_key***',
        api_endpoint: 'https://api.bistrosoft.example.com',
        active: true,
        last_sync: '2024-01-19T09:15:00Z',
        sync_status: 'error',
        error_message: 'API authentication failed'
      }
    };

    const clientConfig = mockConfigs[clientId!];
    if (clientConfig) {
      setConfig(clientConfig);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      // En producción, esto actualizaría Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: `Los cambios para ${config.name} se han guardado exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;

    setTesting(true);
    try {
      const result = await syncClientPOS(config.id);
      
      if (result.success) {
        toast({
          title: "Conexión exitosa",
          description: "La conexión con el POS y Odoo funciona correctamente",
        });
      } else {
        toast({
          title: "Error de conexión",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con los sistemas",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetCircuitBreaker = () => {
    if (!config) return;
    
    integrationLogger.resetCircuitBreaker(config.id, 'Manual reset from client configuration');
    
    setConfig(prev => prev ? { ...prev, sync_status: 'ok', error_message: undefined } : null);
    
    toast({
      title: "Circuit Breaker reseteado",
      description: "La integración ha sido reactivada",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'never':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargando configuración...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </ModuleAccessGuard>
    );
  }

  if (!config) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliente no encontrado</CardTitle>
              <CardDescription>No se pudo encontrar la configuración para el cliente {clientId}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </ModuleAccessGuard>
    );
  }

  const circuitState = integrationLogger.getCircuitState(config.id);
  const isPaused = circuitState?.is_paused || false;

  return (
    <ModuleAccessGuard requiredRole="admin">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/integrations">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{config.name}</h1>
            <p className="text-muted-foreground">
              Configuración de integración • ID: {config.id}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              variant="outline"
              disabled={testing || isPaused}
            >
              <TestTube className="w-4 h-4 mr-2" />
              {testing ? 'Probando...' : 'Probar Conexión'}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/admin/integrations/logs/${config.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                Ver Logs
              </Link>
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {isPaused && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">
                    Integración pausada por circuit breaker
                  </span>
                </div>
                <Button onClick={handleResetCircuitBreaker} size="sm" variant="outline">
                  Reactivar
                </Button>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Motivo: {circuitState?.pause_reason}
              </p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList>
            <TabsTrigger value="config">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="status">
              <Activity className="w-4 h-4 mr-2" />
              Estado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Integración</CardTitle>
                <CardDescription>
                  Modifica los parámetros de conexión y sincronización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Cliente</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: sanitizeInput(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pos_type">Sistema POS</Label>
                    <Select 
                      value={config.pos_type} 
                      onValueChange={(value) => setConfig({ ...config, pos_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePOSTypes.map((pos) => (
                          <SelectItem key={pos.type} value={pos.type}>
                            {pos.name} ({pos.version})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_endpoint">API Endpoint</Label>
                    <Input
                      id="api_endpoint"
                      value={config.api_endpoint || ''}
                      onChange={(e) => setConfig({ ...config, api_endpoint: sanitizeInput(e.target.value) })}
                      placeholder="https://api.example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={config.api_key || ''}
                      onChange={(e) => setConfig({ ...config, api_key: sanitizeInput(e.target.value) })}
                      placeholder="Ingresa la API key"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sync_frequency">Frecuencia de Sync (minutos)</Label>
                    <Input
                      id="sync_frequency"
                      type="number"
                      value={config.sync_frequency}
                      onChange={(e) => setConfig({ ...config, sync_frequency: parseInt(e.target.value) })}
                      min="5"
                      max="1440"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="simulation_mode"
                      checked={config.simulation_mode}
                      onCheckedChange={(checked) => setConfig({ ...config, simulation_mode: checked })}
                    />
                    <Label htmlFor="simulation_mode">Modo Simulación</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={config.active}
                      onCheckedChange={(checked) => setConfig({ ...config, active: checked })}
                    />
                    <Label htmlFor="active">Cliente Activo</Label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Sincronización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Estado Actual</Label>
                      <Badge className={getStatusColor(config.sync_status)}>
                        {config.sync_status === 'ok' && '✅ Operativo'}
                        {config.sync_status === 'error' && '❌ Con Errores'}
                        {config.sync_status === 'pending' && '⏳ Pendiente'}
                        {config.sync_status === 'never' && '⚪ Sin Sincronizar'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Última Sincronización</Label>
                      <div className="text-sm">
                        {config.last_sync 
                          ? new Date(config.last_sync).toLocaleString('es-AR')
                          : 'Nunca'
                        }
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Modo</Label>
                      <Badge variant={config.simulation_mode ? "secondary" : "default"}>
                        {config.simulation_mode ? '🧪 Simulación' : '🏭 Producción'}
                      </Badge>
                    </div>
                  </div>

                  {config.error_message && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <Label className="text-red-800 font-medium">Último Error:</Label>
                      <p className="text-sm text-red-600 mt-1">{config.error_message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {circuitState && (
                <Card>
                  <CardHeader>
                    <CardTitle>Circuit Breaker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Badge variant={isPaused ? "destructive" : "default"}>
                          {isPaused ? '🔴 Pausado' : '🟢 Activo'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label>Fallos Consecutivos</Label>
                        <div className="text-sm font-mono">{circuitState.consecutive_failures}</div>
                      </div>

                      <div className="space-y-2">
                        <Label>Último Éxito</Label>
                        <div className="text-sm">
                          {circuitState.last_success_timestamp 
                            ? new Date(circuitState.last_success_timestamp).toLocaleString('es-AR')
                            : 'Nunca'
                          }
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleAccessGuard>
  );
}