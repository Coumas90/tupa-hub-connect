-- Security Fix Migration: Address critical RLS and database security issues

-- 1. Fix database functions to have proper search_path configuration
CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.refresh_tokens 
  SET is_revoked = true, revoked_at = now()
  WHERE user_id = target_user_id AND is_revoked = false;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_cafe_owner(_user_id uuid, _cafe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE id = _cafe_id AND owner_id = _user_id
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_cafe_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT id FROM public.cafes WHERE owner_id = _user_id;
$function$;

CREATE OR REPLACE FUNCTION public.generate_prize_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_session_limit(target_user_id uuid, max_sessions integer DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'admin'
  );
$function$;

-- 2. Add helper function to get user's location ID securely
CREATE OR REPLACE FUNCTION public.get_user_location_id(_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT location_id FROM public.users 
  WHERE id = _user_id;
$function$;

-- 3. Fix overly permissive RLS policies

-- Fix consumptions table policies (restrict to user's location)
DROP POLICY IF EXISTS "Authenticated users can insert consumptions" ON public.consumptions;
DROP POLICY IF EXISTS "Authenticated users can update consumptions" ON public.consumptions;
DROP POLICY IF EXISTS "Authenticated users can view consumptions" ON public.consumptions;

CREATE POLICY "Users can view consumptions from their location"
ON public.consumptions FOR SELECT
TO authenticated
USING (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

CREATE POLICY "Users can insert consumptions to their location"
ON public.consumptions FOR INSERT
TO authenticated
WITH CHECK (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

CREATE POLICY "Users can update consumptions from their location"
ON public.consumptions FOR UPDATE
TO authenticated
USING (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

-- Fix clients table policies (admin only)
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

CREATE POLICY "Only admins can manage clients"
ON public.clients FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view clients"
ON public.clients FOR SELECT
TO authenticated
USING (true);

-- Fix orders table policies (restrict to user's location)
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON public.orders;

CREATE POLICY "Users can view orders from their location"
ON public.orders FOR SELECT
TO authenticated
USING (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

CREATE POLICY "Users can insert orders to their location"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

CREATE POLICY "Users can update orders from their location"
ON public.orders FOR UPDATE
TO authenticated
USING (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

CREATE POLICY "Users can delete orders from their location"
ON public.orders FOR DELETE
TO authenticated
USING (
  location_id = public.get_user_location_id() OR 
  public.is_admin()
);

-- Fix client_configs policies (admin only for sensitive operations)
DROP POLICY IF EXISTS "Authenticated users can modify client configs" ON public.client_configs;
DROP POLICY IF EXISTS "Authenticated users can read client configs" ON public.client_configs;

CREATE POLICY "Users can view client configs"
ON public.client_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage client configs"
ON public.client_configs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix groups policies (users can only manage their own group)
DROP POLICY IF EXISTS "Authenticated users can manage their groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can read groups" ON public.groups;

CREATE POLICY "Users can view their own group"
ON public.groups FOR SELECT
TO authenticated
USING (
  id = (SELECT group_id FROM public.users WHERE id = auth.uid()) OR
  public.is_admin()
);

CREATE POLICY "Admins can manage groups"
ON public.groups FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Fix locations policies (users can only manage their location)
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;

CREATE POLICY "Users can view locations from their group"
ON public.locations FOR SELECT
TO authenticated
USING (
  group_id = (SELECT group_id FROM public.users WHERE id = auth.uid()) OR
  public.is_admin()
);

CREATE POLICY "Admins can manage locations"
ON public.locations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add secure role management policies for user_roles table
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Create audit log for role changes
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_changed text NOT NULL,
  action text NOT NULL, -- 'granted', 'revoked'
  changed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role audit log"
ON public.role_audit_log FOR SELECT
TO authenticated
USING (public.is_admin());

-- Trigger for role audit logging
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE TRIGGER audit_user_roles_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_changes();