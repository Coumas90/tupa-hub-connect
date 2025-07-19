import type { SyncResult } from '@/lib/integrations/pos/sync.core';

export interface IntegrationSyncRequest {
  clientId: string;
  forceSync?: boolean;
}

export interface IntegrationSyncResponse extends SyncResult {
  clientId: string;
}

// Mock API endpoint - en producción sería una API real
export async function triggerManualSync(clientId: string): Promise<IntegrationSyncResponse> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Aquí se llamaría a la función real de sincronización
    const syncResult = await import('@/lib/integrations/pos/sync.core').then(
      module => module.syncClientPOS(clientId)
    );
    
    return {
      ...syncResult,
      clientId
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown sync error',
      timestamp: new Date().toISOString(),
      clientId
    };
  }
}

export interface ClientConfigUpdate {
  name?: string;
  pos_type?: string;
  api_key?: string;
  api_endpoint?: string;
  simulation_mode?: boolean;
  sync_frequency?: number;
  active?: boolean;
}

// Mock API endpoint para actualizar configuración
export async function updateClientConfig(
  clientId: string, 
  updates: ClientConfigUpdate
): Promise<{ success: boolean; message: string }> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // En producción, esto actualizaría Supabase
    
    return {
      success: true,
      message: 'Client configuration updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown update error'
    };
  }
}

export interface SyncLog {
  id: string;
  client_id: string;
  timestamp: string;
  status: 'success' | 'error';
  records_processed: number;
  error_message?: string;
  duration_ms: number;
}

// Mock API endpoint para obtener logs de sincronización
export async function getSyncLogs(clientId: string, limit = 50): Promise<SyncLog[]> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Mock data
  const mockLogs: SyncLog[] = [
    {
      id: `log_${Date.now()}_1`,
      client_id: clientId,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'success',
      records_processed: 45,
      duration_ms: 2340
    },
    {
      id: `log_${Date.now()}_2`,
      client_id: clientId,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'error',
      records_processed: 0,
      error_message: 'API authentication failed',
      duration_ms: 1200
    }
  ];
  
  return mockLogs.slice(0, limit);
}

// Función para exportar logs como CSV
export function exportLogsAsCSV(logs: SyncLog[], clientName: string): void {
  const headers = ['Timestamp', 'Status', 'Records Processed', 'Duration (ms)', 'Error Message'];
  const rows = logs.map(log => [
    new Date(log.timestamp).toLocaleString('es-AR'),
    log.status,
    log.records_processed.toString(),
    log.duration_ms.toString(),
    log.error_message || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `sync-logs-${clientName}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}