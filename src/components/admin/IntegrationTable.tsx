import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Edit, Download, Eye, Settings, AlertCircle, CheckCircle, Clock, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { syncClientPOS } from '@/integrations/syncClientPOS';
import ClientEditModal from './ClientEditModal';
import { downloadLogsCSV } from '@/lib/api/logs';

interface ClientConfig {
  id: string;
  client_id: string;
  pos_type: string;
  pos_version: string;
  sync_frequency: number;
  simulation_mode: boolean;
  created_at: string;
  updated_at: string;
}

interface IntegrationLog {
  id: string;
  client_id: string;
  pos_type: string;
  operation: string;
  status: 'success' | 'error' | 'pending';
  events_count: number;
  error_message?: string;
  created_at: string;
}

interface IntegrationTableProps {
  filter: 'all' | 'success' | 'error' | 'pending';
}

export default function IntegrationTable({ filter }: IntegrationTableProps) {
  const [configs, setConfigs] = useState<ClientConfig[]>([]);
  const [logs, setLogs] = useState<Record<string, IntegrationLog>>({});
  const [loading, setLoading] = useState(true);
  const [syncingClient, setSyncingClient] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<ClientConfig | null>(null);
  const { toast } = useToast();

  // Fetch client configurations and latest logs
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch client configs
      const { data: configData, error: configError } = await supabase
        .from('client_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (configError) throw configError;

      // Fetch latest log for each client
      const { data: logData, error: logError } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logError) throw logError;

      // Group logs by client_id and get the latest
      const latestLogs: Record<string, IntegrationLog> = {};
      (logData as IntegrationLog[])?.forEach(log => {
        if (!latestLogs[log.client_id] || new Date(log.created_at) > new Date(latestLogs[log.client_id].created_at)) {
          latestLogs[log.client_id] = log;
        }
      });

      setConfigs(configData || []);
      setLogs(latestLogs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load integration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForceSync = async (clientId: string) => {
    setSyncingClient(clientId);
    try {
      // Log the sync start
      await supabase.from('integration_logs').insert({
        client_id: clientId,
        pos_type: configs.find(c => c.client_id === clientId)?.pos_type || 'unknown',
        operation: 'manual_sync',
        status: 'pending',
        events_count: 0
      });

      // Call the sync function
      await syncClientPOS(clientId);

      // Log success
      await supabase.from('integration_logs').insert({
        client_id: clientId,
        pos_type: configs.find(c => c.client_id === clientId)?.pos_type || 'unknown',
        operation: 'manual_sync',
        status: 'success',
        events_count: 0
      });

      toast({
        title: "Sincronización exitosa",
        description: `Cliente ${clientId} sincronizado correctamente`,
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      // Log error
      await supabase.from('integration_logs').insert({
        client_id: clientId,
        pos_type: configs.find(c => c.client_id === clientId)?.pos_type || 'unknown',
        operation: 'manual_sync',
        status: 'error',
        events_count: 0,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Error en sincronización",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });

      await fetchData();
    } finally {
      setSyncingClient(null);
    }
  };

  const handleDownloadLogs = async (clientId: string) => {
    try {
      await downloadLogsCSV(clientId);
      toast({
        title: "Descarga iniciada",
        description: "Los logs se están descargando",
      });
    } catch (error) {
      toast({
        title: "Error en descarga",
        description: "No se pudieron descargar los logs",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string, errorMessage?: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">✅ Exitoso</Badge>;
      case 'error':
        return (
          <Badge variant="destructive" title={errorMessage}>
            ❌ Error
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">⏳ Pendiente</Badge>;
      default:
        return <Badge variant="outline">— Sin datos</Badge>;
    }
  };

  const formatLastSync = (timestamp?: string) => {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleString('es-AR');
  };

  const filteredConfigs = configs.filter(config => {
    if (filter === 'all') return true;
    const log = logs[config.client_id];
    return log?.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Cargando configuraciones...
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>POS Type</TableHead>
            <TableHead>Último Sync</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Eventos</TableHead>
            <TableHead>Modo</TableHead>
            <TableHead>Frecuencia</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredConfigs.map((config) => {
            const log = logs[config.client_id];
            return (
              <TableRow key={config.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log?.status)}
                    <div>
                      <div className="font-medium">{config.client_id}</div>
                      <div className="text-sm text-muted-foreground">v{config.pos_version}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{config.pos_type.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>{formatLastSync(log?.created_at)}</TableCell>
                <TableCell>
                  {getStatusBadge(log?.status, log?.error_message)}
                </TableCell>
                <TableCell>
                  <div className="text-center">
                    <div className="font-mono text-sm">
                      {log?.events_count || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">eventos</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={config.simulation_mode ? "secondary" : "default"}>
                    {config.simulation_mode ? "Simulación" : "Producción"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{config.sync_frequency}min</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleForceSync(config.client_id)}
                      disabled={syncingClient === config.client_id}
                      title="Forzar sincronización"
                    >
                      {syncingClient === config.client_id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {/* TODO: Show logs modal */}}
                      title="Ver logs"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadLogs(config.client_id)}
                      title="Descargar logs CSV"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingClient(config)}
                      title="Configurar"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editingClient && (
        <ClientEditModal
          client={editingClient}
          onSave={async (updatedClient) => {
            try {
              const { error } = await supabase
                .from('client_configs')
                .update({
                  pos_type: updatedClient.pos_type,
                  pos_version: updatedClient.pos_version,
                  sync_frequency: updatedClient.sync_frequency,
                  simulation_mode: updatedClient.simulation_mode
                })
                .eq('id', updatedClient.id);

              if (error) throw error;

              toast({
                title: "Configuración actualizada",
                description: `Cliente ${updatedClient.client_id} actualizado exitosamente`,
              });

              await fetchData();
              setEditingClient(null);
            } catch (error) {
              toast({
                title: "Error",
                description: "No se pudo actualizar la configuración",
                variant: "destructive",
              });
            }
          }}
          onClose={() => setEditingClient(null)}
        />
      )}
    </>
  );
}