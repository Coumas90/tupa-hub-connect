-- Create system_settings table for application configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage system settings
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (public.is_admin());

-- Authenticated users can view non-sensitive settings
CREATE POLICY "Users can view non-sensitive settings" 
ON public.system_settings 
FOR SELECT 
USING (NOT is_sensitive OR public.is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Sentry DSN configuration
INSERT INTO public.system_settings (
  setting_key, 
  setting_value, 
  setting_type, 
  description, 
  is_sensitive
) VALUES (
  'sentry_dsn',
  '⚠️ Not configured yet',
  'text',
  'Sentry DSN for error tracking and monitoring. Configure this to enable error reporting.',
  true
);

-- Insert other common system settings
INSERT INTO public.system_settings (
  setting_key, 
  setting_value, 
  setting_type, 
  description, 
  is_sensitive
) VALUES 
(
  'app_name',
  'TupaHub Connect',
  'text',
  'Application display name',
  false
),
(
  'maintenance_mode',
  'false',
  'boolean',
  'Enable/disable maintenance mode',
  false
),
(
  'max_upload_size_mb',
  '10',
  'number',
  'Maximum file upload size in megabytes',
  false
),
(
  'security_monitoring_enabled',
  'true',
  'boolean',
  'Enable security event monitoring and logging',
  false
);

-- Create function to get system setting value
CREATE OR REPLACE FUNCTION public.get_system_setting(p_setting_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT setting_value 
  FROM public.system_settings 
  WHERE setting_key = p_setting_key;
$$;

-- Create function to update system setting (admin only)
CREATE OR REPLACE FUNCTION public.update_system_setting(
  p_setting_key TEXT,
  p_setting_value TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- Update the setting
  UPDATE public.system_settings 
  SET 
    setting_value = p_setting_value,
    updated_at = now(),
    updated_by = auth.uid()
  WHERE setting_key = p_setting_key;
  
  -- Return true if update was successful
  RETURN FOUND;
END;
$$;