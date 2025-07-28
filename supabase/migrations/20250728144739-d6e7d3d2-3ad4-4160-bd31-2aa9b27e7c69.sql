-- Create invitation tokens table
CREATE TABLE public.invitation_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cafe_id uuid REFERENCES public.cafes(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'barista',
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
  used boolean NOT NULL DEFAULT false,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  INDEX (token),
  INDEX (email),
  INDEX (expires_at)
);

-- Enable RLS
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all invitation tokens" 
ON public.invitation_tokens 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Cafe owners can manage their cafe tokens" 
ON public.invitation_tokens 
FOR ALL 
USING (is_cafe_owner(auth.uid(), cafe_id))
WITH CHECK (is_cafe_owner(auth.uid(), cafe_id));

-- Create function to generate invitation token
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

-- Create trigger function for automatic email sending
CREATE OR REPLACE FUNCTION public.send_barista_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_token TEXT;
  cafe_name TEXT;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Only proceed if the user has barista role
  IF NEW.role = 'barista' THEN
    -- Get user details
    SELECT email, raw_user_meta_data->>'full_name' 
    INTO user_email, user_name
    FROM auth.users 
    WHERE id = NEW.user_id;
    
    -- Get cafe name from users table (assuming cafe relationship)
    SELECT c.name INTO cafe_name
    FROM cafes c
    JOIN users u ON u.id = NEW.user_id
    WHERE c.id = u.group_id; -- Assuming group_id links to cafe
    
    -- Generate invitation token
    invitation_token := generate_invitation_token();
    
    -- Insert invitation token
    INSERT INTO invitation_tokens (token, email, user_id, cafe_id, role, created_by)
    VALUES (invitation_token, user_email, NEW.user_id, 
            (SELECT group_id FROM users WHERE id = NEW.user_id), 
            'barista', auth.uid());
    
    -- Call edge function to send email (using pg_net extension if available)
    -- This would be handled by the edge function we'll create
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
CREATE TRIGGER send_barista_invitation_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_barista_invitation();