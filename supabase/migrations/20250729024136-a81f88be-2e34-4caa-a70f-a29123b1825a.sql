-- Phase 1: Critical Database Security Fixes

-- 1. Fix RLS policies for consumptions table with proper location validation
DROP POLICY IF EXISTS "Users can insert consumptions to their location" ON public.consumptions;
CREATE POLICY "Users can insert consumptions to their location" 
ON public.consumptions 
FOR INSERT 
WITH CHECK (
  (location_id = get_user_location_id(auth.uid())) OR is_admin(auth.uid())
);

-- 2. Fix RLS policies for orders table with proper location validation  
DROP POLICY IF EXISTS "Users can insert orders to their location" ON public.orders;
CREATE POLICY "Users can insert orders to their location"
ON public.orders
FOR INSERT
WITH CHECK (
  (location_id = get_user_location_id(auth.uid())) OR is_admin(auth.uid())
);

-- 3. Secure database functions with proper search path
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier text, p_action text, p_limit integer DEFAULT 5, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window start time
  window_start_time := now() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old records
  DELETE FROM public.rate_limits 
  WHERE window_start < window_start_time;
  
  -- Get current count for this identifier and action
  SELECT count INTO current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action = p_action
    AND window_start >= window_start_time;
  
  -- If no record exists, create one
  IF current_count IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action, count, window_start)
    VALUES (p_identifier, p_action, 1, now())
    ON CONFLICT (identifier, action) 
    DO UPDATE SET 
      count = 1,
      window_start = now(),
      updated_at = now();
    RETURN true;
  END IF;
  
  -- If limit exceeded, return false
  IF current_count >= p_limit THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits 
  SET count = count + 1, updated_at = now()
  WHERE identifier = p_identifier AND action = p_action;
  
  RETURN true;
END;
$function$;

-- 4. Secure log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_user_id uuid DEFAULT NULL::uuid, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb, p_severity text DEFAULT 'medium'::text, p_session_id text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- 5. Create security table indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- 6. Add security logging triggers for admin actions
CREATE OR REPLACE FUNCTION public.log_admin_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log admin actions on sensitive tables
  IF is_admin(auth.uid()) THEN
    PERFORM log_security_event(
      'admin_action',
      auth.uid(),
      NULL,
      NULL,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'record_id', COALESCE(NEW.id, OLD.id)
      ),
      'high'
    );
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- 7. Apply security logging to critical tables
DROP TRIGGER IF EXISTS trigger_log_user_roles_changes ON public.user_roles;
CREATE TRIGGER trigger_log_user_roles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_actions();

DROP TRIGGER IF EXISTS trigger_log_system_settings_changes ON public.system_settings;
CREATE TRIGGER trigger_log_system_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_actions();