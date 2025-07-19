import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Download, 
  Search,
  XCircle,
  Activity,
  Calendar,
  AlertCircle,
  Mail,
  ExternalLink
} from 'lucide-react';
import { downloadLogsCSV } from '@/lib/api/logs';

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

interface HealthMetrics {
  totalErrors24h: number;
  activeIntegrations: number;
  lastSyncs: number;
  staleIntegrations: number;
}

export default function LogsAndMonitoring() {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    totalErrors24h: 0,
    activeIntegrations: 0,
    lastSyncs: 0,
    staleIntegrations: 0
  });
  
  // Filters
  const [clientFilter, setClientFilter] = useState('');
  const [posTypeFilter, setPosTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, clientFilter, posTypeFilter, statusFilter, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch integration logs from Supabase
      const { data: logsData, error: logsError } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (logsError) throw logsError;

      // Fetch client configs for active integrations count
      const { data: configsData, error: configsError } = await supabase
        .from('client_configs')
        .select('*');

      if (configsError) throw configsError;

      setLogs((logsData || []) as IntegrationLog[]);
      
      // Calculate health metrics
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const errors24h = (logsData || []).filter(log => 
        log.status === 'error' && new Date(log.created_at) > twentyFourHoursAgo
      ).length;

      const activeIntegrations = (configsData || []).filter(config => 
        config.pos_type !== 'none'
      ).length;

      const recentSyncs = (logsData || []).filter(log => 
        log.status === 'success' && new Date(log.created_at) > twentyFourHoursAgo
      ).length;

      // Find integrations that haven't synced in 24h
      const latestSyncsByClient = new Map();
      (logsData || []).forEach(log => {
        if (!latestSyncsByClient.has(log.client_id) || 
            new Date(log.created_at) > new Date(latestSyncsByClient.get(log.client_id).created_at)) {
          latestSyncsByClient.set(log.client_id, log);
        }
      });

      const staleIntegrations = Array.from(latestSyncsByClient.values()).filter(log => 
        new Date(log.created_at) < twentyFourHoursAgo
      ).length;

      setHealthMetrics({
        totalErrors24h: errors24h,
        activeIntegrations,
        lastSyncs: recentSyncs,
        staleIntegrations
      });

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

  const applyFilters = () => {
    let filtered = logs;

    if (clientFilter) {
      filtered = filtered.filter(log => log.client_id.includes(clientFilter));
    }

    if (posTypeFilter) {
      filtered = filtered.filter(log => log.pos_type === posTypeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.error_message && log.error_message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleForceSync = async (clientId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-client-pos', {
        body: { client_id: clientId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sincronización iniciada",
          description: `Sincronización forzada para ${clientId}`,
        });
        // Refresh data after a short delay
        setTimeout(loadData, 2000);
      } else {
        throw new Error(data?.error || 'Error en sincronización');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error iniciando sincronización",
        variant: "destructive",
      });
    }
  };

  const handleNotifyTeam = async (clientId: string, errorMessage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-team', {
        body: {
          client_id: clientId,
          error_count: filteredLogs.filter(log => log.client_id === clientId && log.status === 'error').length,
          error_message: errorMessage
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Notificación enviada",
          description: `Equipo notificado sobre errores en ${clientId}`,
        });
      } else {
        throw new Error(data?.error || 'Error enviando notificación');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error enviando notificación",
        variant: "destructive",
      });
    }
  };

  const handleExportLogs = async () => {
    try {
      // Use a generic client ID to export all logs
      await downloadLogsCSV('all');
      toast({
        title: "Descarga iniciada",
        description: "Los logs se están descargando como CSV",
      });
    } catch (error) {
      toast({
        title: "Error en descarga",
        description: "No se pudieron descargar los logs",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Recent';
    }
  };

  const uniqueClients = [...new Set(logs.map(log => log.client_id))];
  const uniquePosTypes = [...new Set(logs.map(log => log.pos_type))];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Cargando datos de monitoreo...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitor de Integraciones</h2>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real de la salud de las integraciones POS
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={handleExportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          {healthMetrics.totalErrors24h > 5 && (
            <Button 
              onClick={() => handleNotifyTeam('all', `${healthMetrics.totalErrors24h} errores en las últimas 24 horas`)}
              variant="destructive" 
              size="sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Notificar Equipo
            </Button>
          )}
        </div>
      </div>

      {/* Health Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{healthMetrics.totalErrors24h}</div>
                <div className="text-sm text-muted-foreground">Errores (24h)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{healthMetrics.activeIntegrations}</div>
                <div className="text-sm text-muted-foreground">Integraciones Activas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{healthMetrics.lastSyncs}</div>
                <div className="text-sm text-muted-foreground">Syncs Exitosos (24h)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{healthMetrics.staleIntegrations}</div>
                <div className="text-sm text-muted-foreground">Sin Sync (+24h)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Cliente, operación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Cliente</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los clientes</SelectItem>
                  {uniqueClients.map(client => (
                    <SelectItem key={client} value={client}>{client}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo POS</label>
              <Select value={posTypeFilter} onValueChange={setPosTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los tipos</SelectItem>
                  {uniquePosTypes.map(type => (
                    <SelectItem key={type} value={type}>{type.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="success">Exitoso</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Integración ({filteredLogs.length} registros)</CardTitle>
          <CardDescription>
            Historial completo de operaciones de sincronización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>POS</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Mensaje</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className={log.status === 'error' ? 'bg-red-50' : ''}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.created_at)}
                    </TableCell>
                    <TableCell className="font-medium">{log.client_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.pos_type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{log.operation}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className="capitalize">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{log.events_count}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={log.error_message || 'Operación completada'}>
                        {log.error_message || 'Operación completada'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getTimeAgo(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {log.status === 'error' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleForceSync(log.client_id)}
                              title="Forzar sincronización"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNotifyTeam(log.client_id, log.error_message || 'Error sin especificar')}
                              title="Notificar al equipo"
                            >
                              <Mail className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}