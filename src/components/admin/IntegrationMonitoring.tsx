import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  AlertTriangle, 
  Pause, 
  Eye, 
  RefreshCw, 
  Activity,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Mail
} from 'lucide-react';

interface ClientSyncStatus {
  client_id: string;
  pos_type: string;
  last_sync: string | null;
  status: 'success' | 'error' | 'paused' | 'never';
  events_7_days: number;
  mode: 'manual' | 'daily' | 'weekly' | 'simulation';
  consecutive_errors: number;
  error_message?: string;
  sync_frequency: number;
  simulation_mode: boolean;
}

interface MonitoringSummary {
  total_clients: number;
  clients_with_errors: number;
  events_24h: number;
  last_active_sync: string | null;
}

interface LogDetail {
  id: string;
  client_id: string;
  pos_type: string;
  operation: string;
  status: string;
  events_count: number;
  error_message?: string;
  created_at: string;
}

export default function IntegrationMonitoring() {
  const [clientStatuses, setClientStatuses] = useState<ClientSyncStatus[]>([]);
  const [filteredStatuses, setFilteredStatuses] = useState<ClientSyncStatus[]>([]);
  const [summary, setSummary] = useState<MonitoringSummary>({
    total_clients: 0,
    clients_with_errors: 0,
    events_24h: 0,
    last_active_sync: null
  });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [posTypeFilter, setPosTypeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  
  // Modal states
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientLogs, setClientLogs] = useState<LogDetail[]>([]);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [syncingClients, setSyncingClients] = useState<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('integration-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integration_logs'
        },
        () => {
          console.log('Real-time update received');
          loadMonitoringData();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clientStatuses, statusFilter, posTypeFilter, clientFilter]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);

      // Fetch client configs
      const { data: configs, error: configsError } = await supabase
        .from('client_configs')
        .select('*');

      if (configsError) throw configsError;

      // Fetch all integration logs
      const { data: logs, error: logsError } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;

      // Process data to create client statuses
      const statusMap = new Map<string, ClientSyncStatus>();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Initialize all clients
      (configs || []).forEach(config => {
        const mode = config.simulation_mode ? 'simulation' : 
                    config.sync_frequency === 0 ? 'manual' :
                    config.sync_frequency === 1440 ? 'daily' : 'weekly';

        statusMap.set(config.client_id, {
          client_id: config.client_id,
          pos_type: config.pos_type,
          last_sync: null,
          status: 'never',
          events_7_days: 0,
          mode,
          consecutive_errors: 0,
          sync_frequency: config.sync_frequency,
          simulation_mode: config.simulation_mode
        });
      });

      // Process logs to update statuses
      const clientLogGroups = new Map<string, LogDetail[]>();
      (logs || []).forEach(log => {
        const clientLogs = clientLogGroups.get(log.client_id) || [];
        clientLogs.push(log);
        clientLogGroups.set(log.client_id, clientLogs);
      });

      clientLogGroups.forEach((clientLogs, clientId) => {
        const status = statusMap.get(clientId);
        if (!status) return;

        // Get latest log
        const latestLog = clientLogs[0];
        if (latestLog) {
          status.last_sync = latestLog.created_at;
          status.status = latestLog.status as any;
          status.error_message = latestLog.error_message;
        }

        // Count events in last 7 days
        status.events_7_days = clientLogs.filter(log => 
          new Date(log.created_at) > sevenDaysAgo
        ).length;

        // Count consecutive errors
        let consecutiveErrors = 0;
        for (const log of clientLogs) {
          if (log.status === 'error') {
            consecutiveErrors++;
          } else if (log.status === 'success') {
            break;
          }
        }
        status.consecutive_errors = consecutiveErrors;

        // Determine if client should be paused
        if (consecutiveErrors >= 3) {
          status.status = 'paused';
        }
      });

      const statusArray = Array.from(statusMap.values());
      setClientStatuses(statusArray);

      // Calculate summary
      const totalClients = statusArray.length;
      const clientsWithErrors = statusArray.filter(s => s.status === 'error' || s.status === 'paused').length;
      const events24h = (logs || []).filter(log => 
        new Date(log.created_at) > twentyFourHoursAgo
      ).length;
      
      const lastActiveSync = (logs || [])
        .filter(log => log.status === 'success')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at || null;

      setSummary({
        total_clients: totalClients,
        clients_with_errors: clientsWithErrors,
        events_24h: events24h,
        last_active_sync: lastActiveSync
      });

      // Check for alerts
      checkForAlerts(statusArray);

    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = (statuses: ClientSyncStatus[]) => {
    const clientsWithMultipleErrors = statuses.filter(s => s.consecutive_errors >= 3);
    const staleClients = statuses.filter(s => {
      if (!s.last_sync) return true;
      const lastSync = new Date(s.last_sync);
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      return lastSync < fortyEightHoursAgo;
    });

    if (clientsWithMultipleErrors.length > 0) {
      toast({
        title: "🚨 Alerta de Errores",
        description: `${clientsWithMultipleErrors.length} cliente(s) con múltiples errores consecutivos`,
        variant: "destructive",
      });
    }

    if (staleClients.length > 0) {
      toast({
        title: "⚠️ Clientes Sin Sincronizar",
        description: `${staleClients.length} cliente(s) sin sincronizar por +48h`,
      });
    }
  };

  const applyFilters = () => {
    let filtered = clientStatuses;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(status => {
        if (statusFilter === 'ok') return status.status === 'success';
        if (statusFilter === 'error') return status.status === 'error' || status.status === 'paused';
        return status.status === statusFilter;
      });
    }

    if (posTypeFilter !== 'all') {
      filtered = filtered.filter(status => status.pos_type === posTypeFilter);
    }

    if (clientFilter !== 'all') {
      filtered = filtered.filter(status => status.client_id === clientFilter);
    }

    setFilteredStatuses(filtered);
  };

  const handleViewLogs = async (clientId: string) => {
    try {
      const { data: logs, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setClientLogs(logs || []);
      setSelectedClient(clientId);
      setLogsModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load client logs",
        variant: "destructive",
      });
    }
  };

  const handleForceSync = async (clientId: string) => {
    setSyncingClients(prev => new Set(prev).add(clientId));
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-client-pos', {
        body: { client_id: clientId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sincronización iniciada",
          description: `Sincronización forzada para ${clientId}: ${data.events_count} eventos`,
        });
        
        // Refresh data after a short delay
        setTimeout(loadMonitoringData, 2000);
      } else {
        throw new Error(data?.error || 'Error en sincronización');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error iniciando sincronización",
        variant: "destructive",
      });
    } finally {
      setSyncingClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  };

  const handleNotifyTeam = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-team', {
        body: {
          client_id: 'multiple',
          error_count: summary.clients_with_errors,
          error_message: `${summary.clients_with_errors} clientes con errores detectados`
        }
      });

      if (error) throw error;

      toast({
        title: "Equipo notificado",
        description: "Alerta enviada al equipo de TUPÁ",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to notify team",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />OK</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      case 'paused':
        return <Badge variant="secondary"><Pause className="w-3 h-3 mr-1" />Pausado</Badge>;
      default:
        return <Badge variant="outline">Nunca</Badge>;
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Reciente';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('es-AR');
  };

  const uniquePosTypes = [...new Set(clientStatuses.map(s => s.pos_type))];
  const uniqueClients = [...new Set(clientStatuses.map(s => s.client_id))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Cargando monitor de sincronización...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Sincronización</h2>
          <p className="text-muted-foreground">
            Monitoreo operativo en tiempo real de integraciones POS
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadMonitoringData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          {summary.clients_with_errors > 0 && (
            <Button onClick={handleNotifyTeam} variant="destructive" size="sm">
              <Mail className="w-4 h-4 mr-2" />
              Notificar Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{summary.total_clients}</div>
                <div className="text-sm text-muted-foreground">Total Clientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{summary.clients_with_errors}</div>
                <div className="text-sm text-muted-foreground">Con Errores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{summary.events_24h}</div>
                <div className="text-sm text-muted-foreground">Eventos (24h)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <div className="text-sm font-medium text-purple-600">
                  {summary.last_active_sync ? formatLastSync(summary.last_active_sync) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Último POS Activo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ok">OK</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">POS Type</label>
              <Select value={posTypeFilter} onValueChange={setPosTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniquePosTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Cliente</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Sincronizaciones ({filteredStatuses.length} clientes)</CardTitle>
          <CardDescription>
            Monitor operativo de sincronizaciones automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>POS Type</TableHead>
                <TableHead>Última Sincronización</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Eventos (7d)</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatuses.map((status) => (
                <TableRow 
                  key={status.client_id}
                  className={status.consecutive_errors >= 3 ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">
                    <div>
                      {status.client_id}
                      {status.consecutive_errors >= 3 && (
                        <div className="text-xs text-red-600">
                          {status.consecutive_errors} errores consecutivos
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{status.pos_type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{formatLastSync(status.last_sync)}</TableCell>
                  <TableCell>{getStatusBadge(status.status)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{status.events_7_days}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.mode === 'simulation' ? 'secondary' : 'default'}>
                      {status.mode.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewLogs(status.client_id)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleForceSync(status.client_id)}
                        disabled={syncingClients.has(status.client_id)}
                      >
                        {syncingClients.has(status.client_id) ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Logs Modal */}
      <Dialog open={logsModalOpen} onOpenChange={setLogsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs de {selectedClient}</DialogTitle>
            <DialogDescription>
              Historial detallado de eventos de sincronización
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Mensaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString('es-AR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.operation}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-center">{log.events_count}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={log.error_message || 'Operación completada'}>
                        {log.error_message || 'Operación completada'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}