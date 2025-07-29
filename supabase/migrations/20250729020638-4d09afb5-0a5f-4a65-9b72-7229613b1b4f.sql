-- Migrate existing roles from user_roles table to user_metadata
-- This will consolidate our dual role system into a single source of truth

-- First, let's update users who have roles in user_roles table but not in user_metadata
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', ur.role::text)
FROM public.user_roles ur
WHERE auth.users.id = ur.user_id 
AND (
  raw_user_meta_data->>'role' IS NULL 
  OR raw_user_meta_data->>'role' = ''
);

-- Set default role for users without any role
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'client')
WHERE raw_user_meta_data->>'role' IS NULL 
OR raw_user_meta_data->>'role' = '';

-- Create audit log for this migration
INSERT INTO public.role_audit_log (user_id, role_changed, action, changed_by)
SELECT 
  u.id,
  u.raw_user_meta_data->>'role',
  'migrated_to_metadata',
  u.id
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' IS NOT NULL;