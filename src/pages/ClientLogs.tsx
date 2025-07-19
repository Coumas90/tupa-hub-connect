import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Filter, RefreshCw } from 'lucide-react';
import { integrationLogger, type IntegrationLog } from '@/lib/integrations/logger';

export default function ClientLogs() {
  const { clientId } = useParams<{ clientId: string }>();
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'fudo' | 'bistrosoft' | 'odoo' | 'system'>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (clientId) {
      loadLogs();
      const interval = setInterval(loadLogs, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [clientId]);

  useEffect(() => {
    applyFilters();
  }, [logs, statusFilter, sourceFilter]);

  const loadLogs = () => {
    if (!clientId) return;
    
    const clientLogs = integrationLogger.getLogsForClient(clientId, 500);
    setLogs(clientLogs);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(log => log.source === sourceFilter);
    }

    setFilteredLogs(filtered);
  };

  const getStatusIcon = (status: IntegrationLog['status']) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status: IntegrationLog['status']) => {
    const colors = {
      success: 'text-green-600 bg-green-50',
      error: 'text-red-600 bg-red-50',
      warning: 'text-yellow-600 bg-yellow-50',
      info: 'text-blue-600 bg-blue-50'
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getOperationColor = (operation: string) => {
    const colors = {
      fetch: 'bg-blue-100 text-blue-800',
      map: 'bg-purple-100 text-purple-800',
      sync: 'bg-green-100 text-green-800',
      auth: 'bg-orange-100 text-orange-800',
      retry: 'bg-yellow-100 text-yellow-800',
      circuit_break: 'bg-red-100 text-red-800'
    };
    return colors[operation as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Source', 'Operation', 'Status', 'Message', 'Duration'],
      ...filteredLogs.map(log => [
        formatTimestamp(log.timestamp),
        log.source,
        log.operation,
        log.status,
        log.message.replace(/"/g, '""'), // Escape quotes
        log.duration_ms?.toString() || ''
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `integration-logs-${clientId}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Logs exportados",
      description: `${filteredLogs.length} registros descargados como CSV`,
    });
  };

  if (loading) {
    return (
      <ModuleAccessGuard requiredRole="admin">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargando logs...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </ModuleAccessGuard>
    );
  }

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
          <div>
            <h1 className="text-3xl font-bold">Logs de Integración</h1>
            <p className="text-muted-foreground">
              Cliente: <span className="font-semibold">{clientId}</span>
            </p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="success">✅ Éxito</SelectItem>
                <SelectItem value="error">❌ Error</SelectItem>
                <SelectItem value="warning">⚠️ Advertencia</SelectItem>
                <SelectItem value="info">ℹ️ Info</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="fudo">Fudo</SelectItem>
                <SelectItem value="bistrosoft">Bistrosoft</SelectItem>
                <SelectItem value="odoo">Odoo</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(log => log.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Éxitos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errores</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Advertencias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {filteredLogs.length}
              </div>
              <div className="text-sm text-muted-foreground">Filtrados</div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Actividad</CardTitle>
            <CardDescription>
              {filteredLogs.length} registros encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Fecha/Hora</TableHead>
                    <TableHead className="w-[100px]">Fuente</TableHead>
                    <TableHead className="w-[120px]">Operación</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead className="w-[80px]">Duración</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.source.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getOperationColor(log.operation)}`}
                        >
                          {log.operation.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(log.status)}`}>
                          <span>{getStatusIcon(log.status)}</span>
                          <span className="capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={log.message}>
                          {log.message.length > 100 ? 
                            `${log.message.substring(0, 97)}...` : 
                            log.message
                          }
                        </div>
                        {log.retry_attempt && (
                          <div className="text-xs text-muted-foreground">
                            Intento #{log.retry_attempt}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron logs con los filtros aplicados
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </ModuleAccessGuard>
  );
}