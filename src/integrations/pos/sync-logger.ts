import { supabase } from '@/integrations/supabase/client';

export interface SyncLogEntry {
  id?: string;
  client_id: string;
  pos_type: string;
  operation: string;
  status: 'success' | 'error' | 'retry' | 'paused';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  records_processed?: number;
  records_success?: number;
  records_failed?: number;
  error_message?: string;
  error_code?: string;
  retry_count?: number;
  next_retry_at?: string;
  backoff_seconds?: number;
  metadata?: Record<string, any>;
}

export interface SyncStatus {
  id?: string;
  client_id: string;
  pos_type: string;
  is_paused: boolean;
  consecutive_failures: number;
  last_success_at?: string;
  last_failure_at?: string;
  last_sync_at?: string;
  pause_reason?: string;
  paused_at?: string;
  next_allowed_sync_at?: string;
  total_syncs: number;
  total_failures: number;
}

export class POSSyncLogger {
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;
  private static readonly BASE_BACKOFF_SECONDS = 30; // Start with 30 seconds
  private static readonly MAX_BACKOFF_SECONDS = 3600; // Max 1 hour

  /**
   * Starts a new sync operation log
   */
  static async startSync(
    clientId: string,
    posType: string,
    operation: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const logEntry: Omit<SyncLogEntry, 'id'> = {
        client_id: clientId,
        pos_type: posType,
        operation,
        status: 'retry', // Initial status
        started_at: new Date().toISOString(),
        retry_count: 0,
        records_processed: 0,
        records_success: 0,
        records_failed: 0,
        metadata: metadata || {}
      };

      const { data, error } = await supabase
        .from('pos_sync_logs')
        .insert(logEntry)
        .select('id')
        .single();

      if (error) {
        console.error('[POSSyncLogger] Failed to create sync log:', error);
        throw error;
      }

      console.log(`[POSSyncLogger] Started sync log ${data.id} for ${clientId}/${posType}/${operation}`);
      return data.id;
    } catch (error) {
      console.error('[POSSyncLogger] Error starting sync:', error);
      throw error;
    }
  }

  /**
   * Updates sync log with success status
   */
  static async logSuccess(
    logId: string,
    recordsProcessed: number = 0,
    recordsSuccess: number = 0,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const completedAt = new Date();
      
      // Get the original log to calculate duration
      const { data: originalLog } = await supabase
        .from('pos_sync_logs')
        .select('started_at, client_id, pos_type')
        .eq('id', logId)
        .single();

      const duration = originalLog 
        ? completedAt.getTime() - new Date(originalLog.started_at).getTime()
        : 0;

      const updateData = {
        status: 'success' as const,
        completed_at: completedAt.toISOString(),
        duration_ms: duration,
        records_processed: recordsProcessed,
        records_success: recordsSuccess,
        ...(metadata && { metadata })
      };

      const { error } = await supabase
        .from('pos_sync_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('[POSSyncLogger] Failed to update sync log:', error);
        throw error;
      }

      // Update sync status on success
      if (originalLog) {
        await this.updateSyncStatus(originalLog.client_id, originalLog.pos_type, true);
      }

      console.log(`[POSSyncLogger] Logged success for ${logId}`);
    } catch (error) {
      console.error('[POSSyncLogger] Error logging success:', error);
      throw error;
    }
  }

  /**
   * Updates sync log with error status and handles retry logic
   */
  static async logError(
    logId: string,
    errorMessage: string,
    errorCode?: string,
    recordsProcessed: number = 0,
    recordsFailed: number = 0,
    metadata?: Record<string, any>
  ): Promise<{ shouldRetry: boolean; nextRetryAt?: Date; isPaused: boolean }> {
    try {
      const completedAt = new Date();
      
      // Get the original log
      const { data: originalLog } = await supabase
        .from('pos_sync_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (!originalLog) {
        throw new Error(`Sync log ${logId} not found`);
      }

      const duration = completedAt.getTime() - new Date(originalLog.started_at).getTime();
      const newRetryCount = (originalLog.retry_count || 0) + 1;
      
      // Calculate exponential backoff
      const backoffSeconds = Math.min(
        this.BASE_BACKOFF_SECONDS * Math.pow(2, newRetryCount - 1),
        this.MAX_BACKOFF_SECONDS
      );
      
      const nextRetryAt = new Date(completedAt.getTime() + backoffSeconds * 1000);
      
      // Determine if we should retry or mark as failed
      const shouldRetry = newRetryCount < 5; // Max 5 retries per operation
      const status = shouldRetry ? 'retry' : 'error';

      const updateData = {
        status,
        completed_at: completedAt.toISOString(),
        duration_ms: duration,
        records_processed: recordsProcessed,
        records_failed: recordsFailed,
        error_message: errorMessage,
        error_code: errorCode,
        retry_count: newRetryCount,
        next_retry_at: shouldRetry ? nextRetryAt.toISOString() : null,
        backoff_seconds: shouldRetry ? backoffSeconds : null,
        metadata: metadata ? { ...(originalLog.metadata as Record<string, any> || {}), ...metadata } : originalLog.metadata
      };

      const { error } = await supabase
        .from('pos_sync_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('[POSSyncLogger] Failed to update sync log:', error);
        throw error;
      }

      // Update sync status on failure
      const isPaused = await this.updateSyncStatus(
        originalLog.client_id, 
        originalLog.pos_type, 
        false
      );

      console.log(`[POSSyncLogger] Logged error for ${logId}, retry: ${shouldRetry}, paused: ${isPaused}`);
      
      return {
        shouldRetry,
        nextRetryAt: shouldRetry ? nextRetryAt : undefined,
        isPaused
      };
    } catch (error) {
      console.error('[POSSyncLogger] Error logging failure:', error);
      throw error;
    }
  }

  /**
   * Updates the sync status for a client
   */
  private static async updateSyncStatus(
    clientId: string,
    posType: string,
    success: boolean
  ): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      // Get or create sync status
      let { data: status } = await supabase
        .from('pos_sync_status')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (!status) {
        // Create new status record
        const newStatus = {
          client_id: clientId,
          pos_type: posType,
          is_paused: false,
          consecutive_failures: success ? 0 : 1,
          last_success_at: success ? now : null,
          last_failure_at: success ? null : now,
          last_sync_at: now,
          total_syncs: 1,
          total_failures: success ? 0 : 1
        };

        const { error } = await supabase
          .from('pos_sync_status')
          .insert(newStatus);

        if (error) throw error;
        return false;
      }

      // Update existing status
      const consecutiveFailures = success ? 0 : (status.consecutive_failures || 0) + 1;
      const shouldPause = consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES;
      
      const updateData = {
        consecutive_failures: consecutiveFailures,
        last_success_at: success ? now : status.last_success_at,
        last_failure_at: success ? status.last_failure_at : now,
        last_sync_at: now,
        total_syncs: (status.total_syncs || 0) + 1,
        total_failures: success ? status.total_failures : (status.total_failures || 0) + 1,
        is_paused: shouldPause,
        pause_reason: shouldPause ? `Auto-paused after ${consecutiveFailures} consecutive failures` : status.pause_reason,
        paused_at: shouldPause ? now : status.paused_at,
        next_allowed_sync_at: shouldPause ? 
          new Date(Date.now() + this.MAX_BACKOFF_SECONDS * 1000).toISOString() : 
          status.next_allowed_sync_at
      };

      const { error } = await supabase
        .from('pos_sync_status')
        .update(updateData)
        .eq('client_id', clientId);

      if (error) throw error;

      if (shouldPause) {
        console.warn(`[POSSyncLogger] Auto-paused sync for ${clientId} after ${consecutiveFailures} failures`);
      }

      return shouldPause;
    } catch (error) {
      console.error('[POSSyncLogger] Error updating sync status:', error);
      return false;
    }
  }

  /**
   * Checks if sync is allowed for a client
   */
  static async canSync(clientId: string): Promise<{ allowed: boolean; reason?: string; nextAllowedAt?: string }> {
    try {
      const { data: status } = await supabase
        .from('pos_sync_status')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (!status) {
        return { allowed: true };
      }

      if (!status.is_paused) {
        return { allowed: true };
      }

      const now = new Date();
      const nextAllowed = status.next_allowed_sync_at ? new Date(status.next_allowed_sync_at) : now;

      if (now >= nextAllowed) {
        // Auto-resume if enough time has passed
        await supabase
          .from('pos_sync_status')
          .update({
            is_paused: false,
            pause_reason: null,
            paused_at: null,
            next_allowed_sync_at: null
          })
          .eq('client_id', clientId);

        return { allowed: true };
      }

      return {
        allowed: false,
        reason: status.pause_reason || 'Sync is paused',
        nextAllowedAt: status.next_allowed_sync_at || undefined
      };
    } catch (error) {
      console.error('[POSSyncLogger] Error checking sync permission:', error);
      return { allowed: false, reason: 'Error checking sync status' };
    }
  }

  /**
   * Manually resumes sync for a client (admin action)
   */
  static async resumeSync(clientId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pos_sync_status')
        .update({
          is_paused: false,
          consecutive_failures: 0,
          pause_reason: null,
          paused_at: null,
          next_allowed_sync_at: null
        })
        .eq('client_id', clientId);

      if (error) throw error;

      console.log(`[POSSyncLogger] Manually resumed sync for ${clientId}`);
      return true;
    } catch (error) {
      console.error('[POSSyncLogger] Error resuming sync:', error);
      return false;
    }
  }

  /**
   * Gets sync logs for a client
   */
  static async getSyncLogs(
    clientId: string,
    limit: number = 50,
    status?: 'success' | 'error' | 'retry' | 'paused'
  ): Promise<SyncLogEntry[]> {
    try {
      let query = supabase
        .from('pos_sync_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as SyncLogEntry[]) || [];
    } catch (error) {
      console.error('[POSSyncLogger] Error getting sync logs:', error);
      return [];
    }
  }

  /**
   * Gets sync status for a client
   */
  static async getSyncStatus(clientId: string): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from('pos_sync_status')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      return data as SyncStatus || null;
    } catch (error) {
      console.error('[POSSyncLogger] Error getting sync status:', error);
      return null;
    }
  }
}