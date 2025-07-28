-- Fix security issues: Remove SECURITY DEFINER views and add proper RLS

-- 1. Drop the mapping view (security definer issue)
DROP VIEW IF EXISTS public.cafes_locations_mapping;

-- 2. Create cafes_locations_mapping as a regular table with RLS
CREATE TABLE IF NOT EXISTS public.cafes_locations_mapping (
  cafe_id uuid,
  cafe_name text,
  owner_id uuid,
  location_id uuid,
  location_slug text,
  location_name text,
  group_id uuid,
  address text,
  is_main boolean,
  qr_code_url text,
  brand_color text,
  logo_url text,
  cafe_created_at timestamp with time zone,
  location_created_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the mapping table
ALTER TABLE public.cafes_locations_mapping ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the mapping table
CREATE POLICY "Users can view mappings for their group" ON public.cafes_locations_mapping
FOR SELECT USING (
  group_id IN (
    SELECT u.group_id FROM public.users u WHERE u.id = auth.uid()
  ) OR is_admin()
);

CREATE POLICY "Admins can manage all mappings" ON public.cafes_locations_mapping
FOR ALL USING (is_admin())
WITH CHECK (is_admin());

-- 3. Create function to sync the mapping table (run periodically)
CREATE OR REPLACE FUNCTION public.sync_cafes_locations_mapping()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 4. Run initial sync
SELECT public.sync_cafes_locations_mapping();