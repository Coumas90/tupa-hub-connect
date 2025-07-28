-- Fix the security issue by adding SET search_path
CREATE OR REPLACE FUNCTION public.assign_admin_role_to_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Now call the function to assign admin role to current user
SELECT public.assign_admin_role_to_current_user();