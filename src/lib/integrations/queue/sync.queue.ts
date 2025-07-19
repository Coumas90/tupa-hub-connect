export interface SyncTask {
  id: string;
  client_id: string;
  task_type: 'sales.sync' | 'inventory.sync' | 'menu.sync';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  scheduled_for?: string;
  attempts: number;
  max_attempts: number;
  error_message?: string;
}

// Mock queue - en producción sería Supabase Queue, RabbitMQ, etc.
const taskQueue: SyncTask[] = [];

export async function enqueueSyncTask(clientId: string, taskType: SyncTask['task_type']): Promise<string> {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task: SyncTask = {
    id: taskId,
    client_id: clientId,
    task_type: taskType,
    status: 'pending',
    created_at: new Date().toISOString(),
    attempts: 0,
    max_attempts: 3
  };
  
  taskQueue.push(task);
  
  // Task enqueued successfully
  
  // En producción, esto triggearía el worker/queue processor
  processTaskAsync(taskId);
  
  return taskId;
}

export async function getTaskStatus(taskId: string): Promise<SyncTask | null> {
  return taskQueue.find(task => task.id === taskId) || null;
}

export async function getClientTasks(clientId: string): Promise<SyncTask[]> {
  return taskQueue.filter(task => task.client_id === clientId);
}

// Simular procesamiento asíncrono
async function processTaskAsync(taskId: string): Promise<void> {
  // Simular delay antes de procesar
  setTimeout(async () => {
    const task = taskQueue.find(t => t.id === taskId);
    if (!task) return;
    
    task.status = 'processing';
    task.attempts += 1;
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular éxito/fallo (90% éxito)
    const success = Math.random() > 0.1;
    
    if (success) {
      task.status = 'completed';
    } else {
      task.status = 'failed';
      task.error_message = 'Simulated processing error';
    }
  }, 1000);
}