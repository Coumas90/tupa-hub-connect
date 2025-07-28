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
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_invitation_tokens_token ON public.invitation_tokens(token);
CREATE INDEX idx_invitation_tokens_email ON public.invitation_tokens(email);
CREATE INDEX idx_invitation_tokens_expires_at ON public.invitation_tokens(expires_at);

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