-- Phase 1: Add org_id to users table and populate it (Fixed)
-- First, add org_id column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS org_id uuid;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);

-- Update users table with org_id from their group_id (assuming group represents organization)
UPDATE public.users 
SET org_id = group_id 
WHERE org_id IS NULL AND group_id IS NOT NULL;

-- For users without group_id, assign them to locations' group_id if they have location_id
UPDATE public.users 
SET org_id = (
  SELECT l.group_id 
  FROM public.locations l 
  WHERE l.id = users.location_id
)
WHERE org_id IS NULL AND location_id IS NOT NULL;

-- Create function to get current user's org_id for RLS policies
CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;

-- Create function to get user with full context (role + org) - FIXED
CREATE OR REPLACE FUNCTION public.get_user_full_context(_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_id uuid,
  email text,
  role text,
  org_id uuid,
  location_id uuid,
  group_name text,
  location_name text,
  is_admin boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    u.id as user_id,
    au.email,
    COALESCE(
      (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = u.id LIMIT 1),
      'user'
    ) as role,
    u.org_id,
    u.location_id,
    g.name as group_name,
    l.name as location_name,
    COALESCE(
      (SELECT ur.role = 'admin' FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin' LIMIT 1),
      false
    ) as is_admin
  FROM public.users u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.groups g ON g.id = u.org_id
  LEFT JOIN public.locations l ON l.id = u.location_id
  WHERE u.id = _user_id;
$$;