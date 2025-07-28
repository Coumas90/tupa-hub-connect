-- Create security logs table for audit trail
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view all security logs" 
ON public.security_logs 
FOR SELECT 
USING (is_admin());

-- System can insert security logs
CREATE POLICY "System can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (true);

-- No updates or deletes allowed
-- (security logs should be immutable)

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'medium',
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_logs (
    event_type, user_id, ip_address, user_agent, 
    details, severity, session_id
  ) VALUES (
    p_event_type, p_user_id, p_ip_address, p_user_agent,
    p_details, p_severity, p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX idx_security_logs_severity ON public.security_logs(severity);