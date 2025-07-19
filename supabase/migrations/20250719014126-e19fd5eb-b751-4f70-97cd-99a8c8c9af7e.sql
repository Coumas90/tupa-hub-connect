-- Create integration_logs table for tracking sync operations
CREATE TABLE public.integration_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL,
    pos_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    events_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_configs table for POS configuration per client
CREATE TABLE public.client_configs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id TEXT NOT NULL UNIQUE,
    pos_type TEXT NOT NULL,
    pos_version TEXT DEFAULT 'v1',
    sync_frequency INTEGER DEFAULT 15, -- minutes
    simulation_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (for future auth implementation)
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_configs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (can be restricted later)
CREATE POLICY "Allow all operations on integration_logs" 
ON public.integration_logs 
FOR ALL 
USING (true);

CREATE POLICY "Allow all operations on client_configs" 
ON public.client_configs 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_integration_logs_updated_at
    BEFORE UPDATE ON public.integration_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_configs_updated_at
    BEFORE UPDATE ON public.client_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_integration_logs_client_pos ON public.integration_logs(client_id, pos_type);
CREATE INDEX idx_integration_logs_created_at ON public.integration_logs(created_at DESC);
CREATE INDEX idx_client_configs_client_id ON public.client_configs(client_id);