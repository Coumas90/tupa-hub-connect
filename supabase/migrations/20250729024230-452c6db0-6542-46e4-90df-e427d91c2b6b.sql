-- Fix remaining security warnings from linter

-- 1. Fix all functions missing secure search path
CREATE OR REPLACE FUNCTION public.get_system_setting(p_setting_key text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT setting_value 
  FROM public.system_settings 
  WHERE setting_key = p_setting_key;
$function$;

CREATE OR REPLACE FUNCTION public.update_system_setting(p_setting_key text, p_setting_value text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_location_by_cafe_id(p_cafe_id uuid)
RETURNS TABLE(location_id uuid, location_slug text, location_name text, group_id uuid, address text, is_main boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    l.id as location_id,
    l.slug as location_slug,
    l.name as location_name,
    l.group_id,
    l.address,
    l.is_main
  FROM public.locations l
  INNER JOIN public.cafes c ON (l.name = c.name OR l.id::text = c.id::text)
  WHERE c.id = p_cafe_id
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_cafe_by_location_id(p_location_id uuid)
RETURNS TABLE(cafe_id uuid, cafe_name text, owner_id uuid, qr_code_url text, brand_color text, logo_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    c.id as cafe_id,
    c.name as cafe_name,
    c.owner_id,
    c.qr_code_url,
    c.brand_color,
    c.logo_url
  FROM public.cafes c
  INNER JOIN public.locations l ON (l.name = c.name OR l.id::text = c.id::text)
  WHERE l.id = p_location_id
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_location_context(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(group_id uuid, group_name text, location_id uuid, location_name text, location_slug text, location_address text, is_main_location boolean, cafe_id uuid, cafe_name text, total_locations_in_group bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  WITH user_location AS (
    SELECT u.group_id, u.location_id
    FROM public.users u
    WHERE u.id = _user_id
  ),
  location_info AS (
    SELECT 
      g.id as group_id,
      g.name as group_name,
      l.id as location_id,
      l.name as location_name,
      l.slug as location_slug,
      l.address as location_address,
      l.is_main as is_main_location,
      COUNT(*) OVER (PARTITION BY l.group_id) as total_locations_in_group
    FROM user_location ul
    JOIN public.groups g ON g.id = ul.group_id  
    JOIN public.locations l ON l.id = ul.location_id
  ),
  cafe_info AS (
    SELECT 
      c.id as cafe_id,
      c.name as cafe_name
    FROM location_info li
    JOIN public.cafes c ON (c.name = li.location_name OR c.id::text = li.location_id::text)
  )
  SELECT 
    li.group_id,
    li.group_name,
    li.location_id,
    li.location_name,
    li.location_slug,
    li.location_address,
    li.is_main_location,
    ci.cafe_id,
    ci.cafe_name,
    li.total_locations_in_group
  FROM location_info li
  LEFT JOIN cafe_info ci ON true;
$function$;

CREATE OR REPLACE FUNCTION public.sync_cafes_locations_mapping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Clear existing mappings
  DELETE FROM public.cafes_locations_mapping;
  
  -- Repopulate with current data
  INSERT INTO public.cafes_locations_mapping (
    cafe_id, cafe_name, owner_id, location_id, location_slug, 
    location_name, group_id, address, is_main, qr_code_url, 
    brand_color, logo_url, cafe_created_at, location_created_at
  )
  SELECT 
    c.id as cafe_id,
    c.name as cafe_name,
    c.owner_id,
    l.id as location_id,
    l.slug as location_slug,
    l.name as location_name,
    l.group_id,
    l.address,
    l.is_main,
    c.qr_code_url,
    c.brand_color,
    c.logo_url,
    c.created_at as cafe_created_at,
    l.created_at as location_created_at
  FROM public.cafes c
  LEFT JOIN public.locations l ON l.name = c.name OR l.id::text = c.id::text;
END;
$function$;