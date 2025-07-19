import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Download, 
  Play,
  Pause,
  XCircle,
  Activity
} from 'lucide-react';
import { integrationLogger, type IntegrationLog, type ClientCircuitState } from '@/lib/integrations/logger';
import { retryQueue, type RetryJob } from '@/lib/integrations/retryQueue';

interface LogsAndMonitoringProps {
  clientId?: string;
}

export default function LogsAndMonitoring({ clientId }: LogsAndMonitoringProps) {
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [circuitStates, setCircuitStates] = useState<ClientCircuitState[]>([]);
  const [retryJobs, setRetryJobs] = useState<RetryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [clientId]);

  const loadData = () => {
    if (clientId) {
      setLogs(integrationLogger.getLogsForClient(clientId, 100));
      const circuitState = integrationLogger.getCircuitState(clientId);
      setCircuitStates(circuitState ? [circuitState] : []);
      setRetryJobs(retryQueue.getJobsForClient(clientId));
    } else {
      setLogs(integrationLogger.getAllLogs(200));
      setCircuitStates(integrationLogger.getAllCircuitStates());
      setRetryJobs(retryQueue.getAllJobs());
    }
    setLoading(false);
  };

  const handleResetCircuitBreaker = (clientId: string) => {
    integrationLogger.resetCircuitBreaker(clientId, 'Manual reset from monitoring dashboard');
    loadData();
    toast({
      title: "Circuit Breaker Reset",
      description: `Integration re-enabled for client ${clientId}`,
    });
  };

  const handleCancelRetryJob = (jobId: string) => {
    const success = retryQueue.cancelJob(jobId);
    if (success) {
      loadData();
      toast({
        title: "Retry Job Cancelled",
        description: `Job ${jobId} has been cancelled`,
      });
    }
  };

  const getStatusIcon = (status: IntegrationLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOperationBadge = (operation: string) => {
    const colors = {
      fetch: 'bg-blue-100 text-blue-800',
      map: 'bg-purple-100 text-purple-800',
      sync: 'bg-green-100 text-green-800',
      auth: 'bg-orange-100 text-orange-800',
      retry: 'bg-yellow-100 text-yellow-800',
      circuit_break: 'bg-red-100 text-red-800',
      alert: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="outline" className={colors[operation as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {operation.toUpperCase()}
      </Badge>
    );
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
      ['Timestamp', 'Client ID', 'Source', 'Operation', 'Status', 'Message'],
      ...logs.map(log => [
        formatTimestamp(log.timestamp),
        log.client_id,
        log.source,
        log.operation,
        log.status,
        log.message
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `integration-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Logs Exported",
      description: "Integration logs have been downloaded as CSV",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading monitoring data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integration Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time logs, circuit breakers, and retry queue status
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Circuit Breakers Status */}
      {circuitStates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Circuit Breakers
            </CardTitle>
            <CardDescription>
              Status of fault tolerance mechanisms per client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {circuitStates.map((state) => (
                <Card key={state.client_id} className={state.is_paused ? 'border-red-200' : 'border-green-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{state.client_id}</span>
                      {state.is_paused ? (
                        <Badge variant="destructive">
                          <Pause className="w-3 h-3 mr-1" />
                          Paused
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">
                          <Play className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      <div>Failures: {state.consecutive_failures}</div>
                      {state.last_failure_timestamp && (
                        <div>Last failure: {formatTimestamp(state.last_failure_timestamp)}</div>
                      )}
                      {state.pause_reason && (
                        <div className="text-red-600">Reason: {state.pause_reason}</div>
                      )}
                    </div>

                    {state.is_paused && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleResetCircuitBreaker(state.client_id)}
                        className="w-full"
                      >
                        Reset Circuit Breaker
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Integration Logs</TabsTrigger>
          <TabsTrigger value="retries">Retry Queue ({retryJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Integration Logs</CardTitle>
              <CardDescription>
                Real-time log of all integration operations ({logs.length} entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell>{log.client_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.source.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{getOperationBadge(log.operation)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="capitalize">{log.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={log.message}>
                            {log.message}
                          </div>
                          {log.duration_ms && (
                            <div className="text-xs text-muted-foreground">
                              {log.duration_ms}ms
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retries">
          <Card>
            <CardHeader>
              <CardTitle>Retry Queue</CardTitle>
              <CardDescription>
                Automatic retry jobs with exponential backoff
              </CardDescription>
            </CardHeader>
            <CardContent>
              {retryJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No retry jobs in queue
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client ID</TableHead>
                      <TableHead>Operation</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Next Retry</TableHead>
                      <TableHead>Last Error</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retryJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.client_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.operation.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          {job.attempt} / {job.max_attempts}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(job.next_retry_at)}
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <div className="truncate" title={job.last_error}>
                            {job.last_error || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRetryJob(job.id)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}