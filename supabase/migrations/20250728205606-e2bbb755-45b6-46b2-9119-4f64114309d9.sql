-- Add the unique constraint first
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);

-- Now fix the function to handle the case properly
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

-- Call the function to assign admin role
SELECT public.assign_admin_role_to_current_user();