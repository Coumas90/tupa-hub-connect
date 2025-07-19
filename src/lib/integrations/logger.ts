export interface IntegrationLog {
  id: string;
  client_id: string;
  source: 'fudo' | 'bistrosoft' | 'odoo' | 'system';
  operation: 'fetch' | 'map' | 'sync' | 'auth' | 'retry' | 'circuit_break';
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: any;
  timestamp: string;
  duration_ms?: number;
  retry_attempt?: number;
  error_code?: string;
}

export interface ClientCircuitState {
  client_id: string;
  consecutive_failures: number;
  last_failure_timestamp?: string;
  is_paused: boolean;
  pause_reason?: string;
  last_success_timestamp?: string;
}

class IntegrationLogger {
  private static instance: IntegrationLogger;
  private logs: IntegrationLog[] = [];
  private circuitStates: Map<string, ClientCircuitState> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): IntegrationLogger {
    if (!IntegrationLogger.instance) {
      IntegrationLogger.instance = new IntegrationLogger();
    }
    return IntegrationLogger.instance;
  }

  private loadFromStorage(): void {
    try {
      const storedLogs = localStorage.getItem('integration_logs');
      const storedCircuitStates = localStorage.getItem('circuit_states');
      
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
      }
      
      if (storedCircuitStates) {
        const states = JSON.parse(storedCircuitStates);
        this.circuitStates = new Map(states);
      }
    } catch (error) {
      console.error('Error loading logs from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Keep only last 1000 logs to prevent storage overflow
      const recentLogs = this.logs.slice(-1000);
      localStorage.setItem('integration_logs', JSON.stringify(recentLogs));
      
      const circuitStatesArray = Array.from(this.circuitStates.entries());
      localStorage.setItem('circuit_states', JSON.stringify(circuitStatesArray));
    } catch (error) {
      console.error('Error saving logs to storage:', error);
    }
  }

  public log(logEntry: Omit<IntegrationLog, 'id' | 'timestamp'>): void {
    const fullLogEntry: IntegrationLog = {
      ...logEntry,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.logs.push(fullLogEntry);
    this.updateCircuitBreaker(logEntry.client_id, logEntry.status);
    this.saveToStorage();

    // Production logging would send to monitoring service

    // Check if we need to send alerts
    if (logEntry.status === 'error') {
      this.checkForAlerts(logEntry.client_id, fullLogEntry);
    }
  }

  private updateCircuitBreaker(clientId: string, status: IntegrationLog['status']): void {
    let circuitState = this.circuitStates.get(clientId) || {
      client_id: clientId,
      consecutive_failures: 0,
      is_paused: false
    };

    if (status === 'success') {
      circuitState.consecutive_failures = 0;
      circuitState.last_success_timestamp = new Date().toISOString();
      circuitState.is_paused = false;
      circuitState.pause_reason = undefined;
    } else if (status === 'error') {
      circuitState.consecutive_failures += 1;
      circuitState.last_failure_timestamp = new Date().toISOString();

      // Circuit breaker: pause after 3 consecutive failures
      if (circuitState.consecutive_failures >= 3) {
        circuitState.is_paused = true;
        circuitState.pause_reason = `${circuitState.consecutive_failures} consecutive failures`;
        
        this.log({
          client_id: clientId,
          source: 'system',
          operation: 'circuit_break',
          status: 'warning',
          message: `Circuit breaker activated for client ${clientId}. Integration paused after ${circuitState.consecutive_failures} consecutive failures.`
        });
      }
    }

    this.circuitStates.set(clientId, circuitState);
  }

  private checkForAlerts(clientId: string, logEntry: IntegrationLog): void {
    const circuitState = this.circuitStates.get(clientId);
    
    // Send alert if circuit breaker activates
    if (circuitState?.is_paused && circuitState.consecutive_failures === 3) {
      this.sendAlert({
        level: 'critical',
        title: `Integration Paused - Client ${clientId}`,
        message: `Circuit breaker activated for client ${clientId} after 3 consecutive failures. Manual intervention required.`,
        details: logEntry
      });
    }
    
    // Send alert for individual errors
    this.sendAlert({
      level: 'error',
      title: `Integration Error - ${logEntry.source}`,
      message: logEntry.message,
      details: logEntry
    });
  }

  private sendAlert(alert: {
    level: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    details?: any;
  }): void {
    // In production, this would send to Slack, email, etc.
    console.warn(`🚨 ALERT [${alert.level.toUpperCase()}]: ${alert.title}`, alert);
    
    // Store alert for admin dashboard
    const alertLog: IntegrationLog = {
      id: `alert_${Date.now()}`,
      client_id: alert.details?.client_id || 'system',
      source: 'system',
      operation: 'alert' as any,
      status: 'warning',
      message: `${alert.title}: ${alert.message}`,
      details: alert.details,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(alertLog);
    this.saveToStorage();
  }

  public getLogsForClient(clientId: string, limit = 50): IntegrationLog[] {
    return this.logs
      .filter(log => log.client_id === clientId)
      .slice(-limit)
      .reverse();
  }

  public getAllLogs(limit = 100): IntegrationLog[] {
    return this.logs.slice(-limit).reverse();
  }

  public getCircuitState(clientId: string): ClientCircuitState | undefined {
    return this.circuitStates.get(clientId);
  }

  public getAllCircuitStates(): ClientCircuitState[] {
    return Array.from(this.circuitStates.values());
  }

  public resetCircuitBreaker(clientId: string, reason = 'Manual reset'): void {
    const circuitState = this.circuitStates.get(clientId);
    if (circuitState) {
      circuitState.consecutive_failures = 0;
      circuitState.is_paused = false;
      circuitState.pause_reason = undefined;
      this.circuitStates.set(clientId, circuitState);
      
      this.log({
        client_id: clientId,
        source: 'system',
        operation: 'circuit_break',
        status: 'info',
        message: `Circuit breaker reset for client ${clientId}. Reason: ${reason}`
      });
      
      this.saveToStorage();
    }
  }

  public clearLogs(clientId?: string): void {
    if (clientId) {
      this.logs = this.logs.filter(log => log.client_id !== clientId);
    } else {
      this.logs = [];
    }
    this.saveToStorage();
  }
}

// Export singleton instance
export const integrationLogger = IntegrationLogger.getInstance();

// Helper functions for easy logging
export const logSuccess = (clientId: string, source: IntegrationLog['source'], operation: IntegrationLog['operation'], message: string, details?: any) => {
  integrationLogger.log({ client_id: clientId, source, operation, status: 'success', message, details });
};

export const logError = (clientId: string, source: IntegrationLog['source'], operation: IntegrationLog['operation'], message: string, details?: any) => {
  integrationLogger.log({ client_id: clientId, source, operation, status: 'error', message, details });
};

export const logWarning = (clientId: string, source: IntegrationLog['source'], operation: IntegrationLog['operation'], message: string, details?: any) => {
  integrationLogger.log({ client_id: clientId, source, operation, status: 'warning', message, details });
};

export const logInfo = (clientId: string, source: IntegrationLog['source'], operation: IntegrationLog['operation'], message: string, details?: any) => {
  integrationLogger.log({ client_id: clientId, source, operation, status: 'info', message, details });
};
