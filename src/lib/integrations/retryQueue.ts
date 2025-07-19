import { integrationLogger, logError, logInfo, logWarning } from './logger';
import { syncClientPOS } from './pos/sync.core';

export interface RetryJob {
  id: string;
  client_id: string;
  operation: 'sync' | 'auth' | 'fetch';
  attempt: number;
  max_attempts: number;
  next_retry_at: string;
  created_at: string;
  last_error?: string;
  backoff_ms: number;
}

export class RetryQueue {
  private static instance: RetryQueue;
  private jobs: Map<string, RetryJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isProcessing = false;

  private constructor() {
    this.loadFromStorage();
    this.startProcessing();
  }

  public static getInstance(): RetryQueue {
    if (!RetryQueue.instance) {
      RetryQueue.instance = new RetryQueue();
    }
    return RetryQueue.instance;
  }

  private loadFromStorage(): void {
    try {
      const storedJobs = localStorage.getItem('retry_jobs');
      if (storedJobs) {
        const jobsArray = JSON.parse(storedJobs);
        this.jobs = new Map(jobsArray);
      }
    } catch (error) {
      console.error('Error loading retry jobs from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const jobsArray = Array.from(this.jobs.entries());
      localStorage.setItem('retry_jobs', JSON.stringify(jobsArray));
    } catch (error) {
      console.error('Error saving retry jobs to storage:', error);
    }
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 0s, 10s, 30s, 90s, 270s...
    if (attempt === 1) return 0;
    return Math.min(10000 * Math.pow(3, attempt - 2), 300000); // Max 5 minutes
  }

  public enqueueRetry(
    clientId: string, 
    operation: RetryJob['operation'], 
    maxAttempts = 3,
    initialError?: string
  ): string {
    // Check circuit breaker first
    const circuitState = integrationLogger.getCircuitState(clientId);
    if (circuitState?.is_paused) {
      logWarning(clientId, 'system', 'retry', 'Retry skipped - circuit breaker is open');
      return '';
    }

    const jobId = `retry_${clientId}_${operation}_${Date.now()}`;
    const backoffMs = this.calculateBackoff(1);
    const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

    const job: RetryJob = {
      id: jobId,
      client_id: clientId,
      operation,
      attempt: 1,
      max_attempts: maxAttempts,
      next_retry_at: nextRetryAt,
      created_at: new Date().toISOString(),
      last_error: initialError,
      backoff_ms: backoffMs
    };

    this.jobs.set(jobId, job);
    this.saveToStorage();

    // Schedule the retry
    this.scheduleJob(job);

    logInfo(clientId, 'system', 'retry', `Retry job enqueued: ${jobId}, next attempt in ${backoffMs}ms`);
    
    return jobId;
  }

  private scheduleJob(job: RetryJob): void {
    const delay = new Date(job.next_retry_at).getTime() - Date.now();
    
    if (delay <= 0) {
      // Execute immediately
      this.executeJob(job);
    } else {
      // Schedule for later
      const timer = setTimeout(() => {
        this.executeJob(job);
      }, delay);
      
      this.timers.set(job.id, timer);
    }
  }

  private async executeJob(job: RetryJob): Promise<void> {
    try {
      logInfo(job.client_id, 'system', 'retry', `Executing retry attempt ${job.attempt}/${job.max_attempts} for ${job.operation}`);

      let success = false;

      // Execute the appropriate operation
      switch (job.operation) {
        case 'sync':
          const syncResult = await syncClientPOS(job.client_id);
          success = syncResult.success;
          if (!success) {
            job.last_error = syncResult.message;
          }
          break;
        
        case 'auth':
          // Implement auth retry logic
          success = await this.retryAuth(job.client_id);
          break;
          
        case 'fetch':
          // Implement fetch retry logic
          success = await this.retryFetch(job.client_id);
          break;
      }

      if (success) {
        // Success - remove job and log
        this.removeJob(job.id);
        logInfo(job.client_id, 'system', 'retry', `Retry successful for ${job.operation} after ${job.attempt} attempts`);
      } else {
        // Failed - check if we should retry again
        await this.handleFailedAttempt(job);
      }

    } catch (error) {
      job.last_error = error instanceof Error ? error.message : 'Unknown retry error';
      await this.handleFailedAttempt(job);
    }
  }

  private async handleFailedAttempt(job: RetryJob): Promise<void> {
    job.attempt += 1;

    if (job.attempt > job.max_attempts) {
      // Max attempts reached - give up
      this.removeJob(job.id);
      logError(job.client_id, 'system', 'retry', `Retry failed permanently after ${job.max_attempts} attempts: ${job.last_error}`);
      
      // This could trigger circuit breaker
      return;
    }

    // Schedule next retry
    job.backoff_ms = this.calculateBackoff(job.attempt);
    job.next_retry_at = new Date(Date.now() + job.backoff_ms).toISOString();
    
    this.jobs.set(job.id, job);
    this.saveToStorage();
    
    logWarning(job.client_id, 'system', 'retry', `Retry attempt ${job.attempt - 1} failed, scheduling next attempt in ${job.backoff_ms}ms: ${job.last_error}`);
    
    this.scheduleJob(job);
  }

  private async retryAuth(clientId: string): Promise<boolean> {
    // Mock auth retry - in production would test POS auth
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Math.random() > 0.3; // 70% success rate
  }

  private async retryFetch(clientId: string): Promise<boolean> {
    // Mock fetch retry - in production would test POS data fetch
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.random() > 0.2; // 80% success rate
  }

  private removeJob(jobId: string): void {
    this.jobs.delete(jobId);
    
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
    
    this.saveToStorage();
  }

  private startProcessing(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    // Process existing jobs on startup
    for (const job of this.jobs.values()) {
      this.scheduleJob(job);
    }

    // Periodic cleanup of completed jobs
    setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60000); // Every minute
  }

  private cleanupCompletedJobs(): void {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [jobId, job] of this.jobs.entries()) {
      const jobTime = new Date(job.created_at).getTime();
      if (jobTime < cutoff) {
        this.removeJob(jobId);
      }
    }
  }

  public getJobsForClient(clientId: string): RetryJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.client_id === clientId);
  }

  public getAllJobs(): RetryJob[] {
    return Array.from(this.jobs.values());
  }

  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job) {
      this.removeJob(jobId);
      logInfo(job.client_id, 'system', 'retry', `Retry job cancelled: ${jobId}`);
      return true;
    }
    return false;
  }

  public cancelAllJobsForClient(clientId: string): number {
    const jobs = this.getJobsForClient(clientId);
    jobs.forEach(job => this.removeJob(job.id));
    logInfo(clientId, 'system', 'retry', `Cancelled ${jobs.length} retry jobs for client`);
    return jobs.length;
  }
}

// Export singleton instance
export const retryQueue = RetryQueue.getInstance();