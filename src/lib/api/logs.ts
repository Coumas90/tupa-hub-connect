import { supabase } from '@/integrations/supabase/client';

export interface IntegrationLog {
  id: string;
  client_id: string;
  pos_type: string;
  operation: string;
  status: 'success' | 'error' | 'pending';
  events_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the latest logs for a specific client
 */
export async function getClientLogs(clientId: string, limit = 5): Promise<IntegrationLog[]> {
  const { data, error } = await supabase
    .from('integration_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching client logs:', error);
    throw error;
  }

  return (data || []) as IntegrationLog[];
}

/**
 * Get logs for all clients with optional filtering
 */
export async function getAllLogs(
  status?: 'success' | 'error' | 'pending',
  limit = 100
): Promise<IntegrationLog[]> {
  let query = supabase
    .from('integration_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all logs:', error);
    throw error;
  }

  return (data || []) as IntegrationLog[];
}

/**
 * Download logs as CSV for a specific client
 */
export async function downloadLogsCSV(clientId: string): Promise<void> {
  try {
    const logs = await getClientLogs(clientId, 1000); // Get more logs for CSV

    if (logs.length === 0) {
      throw new Error('No hay logs disponibles para este cliente');
    }

    // Convert logs to CSV format
    const csvHeaders = [
      'ID',
      'Cliente',
      'Tipo POS',
      'Operación',
      'Estado',
      'Eventos',
      'Mensaje Error',
      'Fecha Creación',
      'Fecha Actualización'
    ];

    const csvRows = logs.map(log => [
      log.id,
      log.client_id,
      log.pos_type,
      log.operation,
      log.status,
      log.events_count.toString(),
      log.error_message || '',
      new Date(log.created_at).toLocaleString('es-AR'),
      new Date(log.updated_at).toLocaleString('es-AR')
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs_${clientId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw error;
  }
}

/**
 * Create a new integration log entry
 */
export async function createLog(logData: Omit<IntegrationLog, 'id' | 'created_at' | 'updated_at'>): Promise<IntegrationLog> {
  const { data, error } = await supabase
    .from('integration_logs')
    .insert(logData)
    .select()
    .single();

  if (error) {
    console.error('Error creating log:', error);
    throw error;
  }

  return data as IntegrationLog;
}

/**
 * Update an existing log entry
 */
export async function updateLog(
  logId: string, 
  updates: Partial<Pick<IntegrationLog, 'status' | 'events_count' | 'error_message'>>
): Promise<IntegrationLog> {
  const { data, error } = await supabase
    .from('integration_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    console.error('Error updating log:', error);
    throw error;
  }

  return data as IntegrationLog;
}

/**
 * Get log statistics for dashboard
 */
export async function getLogStats(): Promise<{
  total: number;
  success: number;
  error: number;
  pending: number;
  last24Hours: number;
}> {
  try {
    // Get total counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('integration_logs')
      .select('status')
      .not('status', 'is', null);

    if (statusError) throw statusError;

    // Get logs from last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentLogs, error: recentError } = await supabase
      .from('integration_logs')
      .select('id')
      .gte('created_at', yesterday.toISOString());

    if (recentError) throw recentError;

    // Calculate statistics
    const stats = {
      total: statusCounts?.length || 0,
      success: statusCounts?.filter(log => log.status === 'success').length || 0,
      error: statusCounts?.filter(log => log.status === 'error').length || 0,
      pending: statusCounts?.filter(log => log.status === 'pending').length || 0,
      last24Hours: recentLogs?.length || 0
    };

    return stats;
  } catch (error) {
    console.error('Error fetching log stats:', error);
    return {
      total: 0,
      success: 0,
      error: 0,
      pending: 0,
      last24Hours: 0
    };
  }
}