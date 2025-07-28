-- Insert admin role for all existing users (you can adjust this to be more specific)
-- This will give admin access to the most recent user accounts
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role 
FROM auth.users 
WHERE email IN ('martinezcamila651+10@gmail.com', 'comasnicolas+10@gmail.com', 'martinezcamila651@gmail.com', 'comasnicolas+1@gmail.com', 'comasnicolas@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;