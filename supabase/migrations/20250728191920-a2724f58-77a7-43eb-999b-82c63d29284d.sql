-- Phase 2: Multi-Tenant Model Normalization
-- Standardize on locations model with cafes mapping

-- 1. Add slug field to locations for friendly URLs
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- 2. Create unique constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS locations_slug_idx ON public.locations(slug) WHERE slug IS NOT NULL;

-- 3. Create cafes → locations mapping view for backward compatibility
CREATE OR REPLACE VIEW public.cafes_locations_mapping AS
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

-- 4. Function to get location by cafe_id for backward compatibility
CREATE OR REPLACE FUNCTION public.get_location_by_cafe_id(p_cafe_id uuid)
RETURNS TABLE (
  location_id uuid,
  location_slug text,
  location_name text,
  group_id uuid,
  address text,
  is_main boolean
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 5. Function to get cafe_id by location_id for backward compatibility  
CREATE OR REPLACE FUNCTION public.get_cafe_by_location_id(p_location_id uuid)
RETURNS TABLE (
  cafe_id uuid,
  cafe_name text,
  owner_id uuid,
  qr_code_url text,
  brand_color text,
  logo_url text
)
LANGUAGE sql  
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 6. Enhanced location context function with cafe compatibility
CREATE OR REPLACE FUNCTION public.get_user_location_context(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  group_id uuid,
  group_name text,
  location_id uuid,
  location_name text,
  location_slug text,
  location_address text,
  is_main_location boolean,
  cafe_id uuid,
  cafe_name text,
  total_locations_in_group bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER  
SET search_path = 'public'
AS $$
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
$$;

-- 7. Generate slugs for existing locations (if not present)
UPDATE public.locations 
SET slug = LOWER(REGEXP_REPLACE(
  REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE slug IS NULL;