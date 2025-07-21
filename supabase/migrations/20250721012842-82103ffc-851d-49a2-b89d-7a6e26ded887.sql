-- Create pos_sync_logs table for tracking POS synchronization attempts
CREATE TABLE public.pos_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  pos_type TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'sync', 'fetch_sales', 'store_consumption'
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'retry', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  backoff_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pos_sync_status table for tracking sync status per client
CREATE TABLE public.pos_sync_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  pos_type TEXT NOT NULL,
  is_paused BOOLEAN DEFAULT false,
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  pause_reason TEXT,
  paused_at TIMESTAMP WITH TIME ZONE,
  next_allowed_sync_at TIMESTAMP WITH TIME ZONE,
  total_syncs INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_pos_sync_logs_client_status ON public.pos_sync_logs(client_id, status);
CREATE INDEX idx_pos_sync_logs_next_retry ON public.pos_sync_logs(next_retry_at) WHERE status = 'retry';
CREATE INDEX idx_pos_sync_status_client ON public.pos_sync_status(client_id);
CREATE INDEX idx_pos_sync_status_paused ON public.pos_sync_status(is_paused, next_allowed_sync_at);

-- Enable Row Level Security
ALTER TABLE public.pos_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sync_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view sync logs" 
ON public.pos_sync_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert sync logs" 
ON public.pos_sync_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sync logs" 
ON public.pos_sync_logs 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can view sync status" 
ON public.pos_sync_status 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage sync status" 
ON public.pos_sync_status 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_pos_sync_logs_updated_at
  BEFORE UPDATE ON public.pos_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_sync_status_updated_at
  BEFORE UPDATE ON public.pos_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();