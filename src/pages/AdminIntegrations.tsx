import { useState, useEffect } from 'react';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Edit, Download, Filter } from 'lucide-react';
import { syncClientPOS } from '@/lib/integrations/pos/sync.core';
import { getAvailablePOSTypes } from '@/lib/integrations/pos/pos.registry';

interface Client {
  id: string;
  name: string;
  pos_type: string;
  last_sync?: string;
  sync_status: 'ok' | 'error' | 'pending' | 'never';
  simulation_mode: boolean;
  sync_frequency: number;
  api_key?: string;
  api_endpoint?: string;
  active: boolean;
  error_message?: string;
}

export default function AdminIntegrations() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [syncingClient, setSyncingClient] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ok' | 'error' | 'pending'>('all');
  const { toast } = useToast();

  // Mock data - en producción vendría de Supabase
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: 'client_001',
        name: 'Café Central - Villa Urquiza',
        pos_type: 'fudo',
        last_sync: '2024-01-19T10:30:00Z',
        sync_status: 'ok',
        simulation_mode: true,
        sync_frequency: 30,
        api_key: 'fudo_key_***',
        active: true
      },
      {
        id: 'client_002',
        name: 'Bistro Norte - Palermo',
        pos_type: 'bistrosoft',
        last_sync: '2024-01-19T09:15:00Z',
        sync_status: 'error',
        simulation_mode: false,
        sync_frequency: 15,
        api_endpoint: 'https://api.bistrosoft.example.com',
        active: true,
        error_message: 'API authentication failed'
      },
      {
        id: 'client_003',
        name: 'Tostado Express - Centro',
        pos_type: 'fudo',
        last_sync: undefined,
        sync_status: 'never',
        simulation_mode: true,
        sync_frequency: 60,
        active: false
      }
    ];

    setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 500);
  }, []);

  const handleForceSync = async (clientId: string) => {
    setSyncingClient(clientId);
    try {
      const result = await syncClientPOS(clientId);
      
      if (result.success) {
        toast({
          title: "Sincronización exitosa",
          description: `${result.message} - ${result.recordsProcessed || 0} registros procesados`,
        });

        // Actualizar estado del cliente
        setClients(prev => prev.map(client => 
          client.id === clientId 
            ? { ...client, sync_status: 'ok', last_sync: result.timestamp }
            : client
        ));
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error en sincronización",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });

      setClients(prev => prev.map(client => 
        client.id === clientId 
          ? { ...client, sync_status: 'error', error_message: error instanceof Error ? error.message : "Error desconocido" }
          : client
      ));
    } finally {
      setSyncingClient(null);
    }
  };

  const handleSaveClient = (updatedClient: Client) => {
    setClients(prev => prev.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    ));
    setEditingClient(null);
    
    toast({
      title: "Cliente actualizado",
      description: `Configuración de ${updatedClient.name} guardada exitosamente`,
    });
  };

  const getStatusBadge = (status: Client['sync_status'], errorMessage?: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="default" className="bg-green-500">✅ OK</Badge>;
      case 'error':
        return (
          <Badge variant="destructive" title={errorMessage}>
            ❌ Error
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">⏳ Pendiente</Badge>;
      case 'never':
        return <Badge variant="outline">Sin sincronizar</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp) return 'Nunca';
    return new Date(timestamp).toLocaleString('es-AR');
  };

  const filteredClients = clients.filter(client => 
    filter === 'all' || client.sync_status === filter
  );

  const availablePOSTypes = getAvailablePOSTypes();

  if (loading) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargando integraciones...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </ModuleAccessGuard>
    );
  }

  return (
    <ModuleAccessGuard requiredRole="admin">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Administración de Integraciones POS</h1>
            <p className="text-muted-foreground">
              Gestiona las conexiones POS y sincronizaciones de todos los clientes
            </p>
          </div>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ok">OK</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Integraciones</CardTitle>
            <CardDescription>
              {filteredClients.length} cliente(s) {filter !== 'all' ? `con estado: ${filter}` : 'total'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>POS</TableHead>
                  <TableHead>Último Sync</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{client.pos_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{formatLastSync(client.last_sync)}</TableCell>
                    <TableCell>{getStatusBadge(client.sync_status, client.error_message)}</TableCell>
                    <TableCell>
                      <Badge variant={client.simulation_mode ? "secondary" : "default"}>
                        {client.simulation_mode ? "Simulación" : "Producción"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleForceSync(client.id)}
                          disabled={syncingClient === client.id}
                        >
                          {syncingClient === client.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingClient(client)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Configuración - {client.name}</DialogTitle>
                              <DialogDescription>
                                Modifica la configuración de integración POS para este cliente
                              </DialogDescription>
                            </DialogHeader>
                            
                            <ClientEditForm 
                              client={client} 
                              availablePOSTypes={availablePOSTypes}
                              onSave={handleSaveClient}
                              onCancel={() => setEditingClient(null)}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ModuleAccessGuard>
  );
}

interface ClientEditFormProps {
  client: Client;
  availablePOSTypes: Array<{ type: string; name: string; version: string; features: string[] }>;
  onSave: (client: Client) => void;
  onCancel: () => void;
}

function ClientEditForm({ client, availablePOSTypes, onSave, onCancel }: ClientEditFormProps) {
  const [formData, setFormData] = useState<Client>(client);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Cliente</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pos_type">Tipo de POS</Label>
          <Select 
            value={formData.pos_type} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, pos_type: value }))}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="api_key">API Key</Label>
          <Input
            id="api_key"
            type="password"
            value={formData.api_key || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
            placeholder="Ingresa la API key"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="api_endpoint">API Endpoint</Label>
          <Input
            id="api_endpoint"
            value={formData.api_endpoint || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: e.target.value }))}
            placeholder="https://api.example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sync_frequency">Frecuencia de Sync (minutos)</Label>
          <Input
            id="sync_frequency"
            type="number"
            value={formData.sync_frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, sync_frequency: parseInt(e.target.value) }))}
            min="5"
            max="1440"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mt-6">
            <Switch
              id="simulation_mode"
              checked={formData.simulation_mode}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, simulation_mode: checked }))}
            />
            <Label htmlFor="simulation_mode">Modo Simulación</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
        />
        <Label htmlFor="active">Cliente Activo</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}