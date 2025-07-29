-- Security Fix: Add SET search_path to functions missing it
-- This addresses the "Function Search Path Mutable" warning

-- Fix functions that are missing SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Run cleanup when inserting new tokens
  PERFORM public.cleanup_expired_password_tokens();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  token TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a secure random token
    token := encode(gen_random_bytes(32), 'hex');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM invitation_tokens WHERE token = token) INTO exists_check;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN token;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set created_by on INSERT
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
  END IF;
  
  -- Set updated_by on UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.refresh_tokens 
  SET is_revoked = true, revoked_at = now()
  WHERE user_id = target_user_id AND is_revoked = false;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_prize_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a code like "TUPA2024W03-ABC123"
    code := 'TUPA' || 
            EXTRACT(YEAR FROM CURRENT_DATE) || 
            'W' || LPAD(EXTRACT(WEEK FROM CURRENT_DATE)::TEXT, 2, '0') || 
            '-' || 
            UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM giveaway_winners WHERE prize_code = code) INTO exists_check;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_session_limit(target_user_id uuid, max_sessions integer DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Revoke oldest sessions if limit exceeded
  WITH oldest_sessions AS (
    SELECT id FROM public.refresh_tokens
    WHERE user_id = target_user_id 
    AND is_revoked = false 
    AND expires_at > now()
    ORDER BY last_used_at ASC
    OFFSET max_sessions
  )
  UPDATE public.refresh_tokens 
  SET is_revoked = true, revoked_at = now()
  WHERE id IN (SELECT id FROM oldest_sessions);
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, role_changed, action, changed_by)
    VALUES (NEW.user_id, NEW.role, 'granted', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, role_changed, action, changed_by)
    VALUES (OLD.user_id, OLD.role, 'revoked', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_role_to_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Add triggers for admin action logging on sensitive tables
CREATE OR REPLACE TRIGGER admin_actions_trigger_users
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.log_admin_actions();

CREATE OR REPLACE TRIGGER admin_actions_trigger_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_admin_actions();

CREATE OR REPLACE TRIGGER admin_actions_trigger_system_settings
    AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_admin_actions();

-- Add automatic cleanup triggers for expired tokens
CREATE OR REPLACE TRIGGER auto_cleanup_password_tokens
    BEFORE INSERT ON public.password_reset_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_cleanup_expired_tokens();

-- Add role audit triggers
CREATE OR REPLACE TRIGGER role_changes_audit
    AFTER INSERT OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes();