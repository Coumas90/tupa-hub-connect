-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for password reset tokens
CREATE POLICY "Password reset tokens are private" 
ON public.password_reset_tokens 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;

-- Create trigger for auto cleanup
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tokens()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Run cleanup when inserting new tokens
  PERFORM public.cleanup_expired_password_tokens();
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_cleanup_password_tokens
BEFORE INSERT ON public.password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION public.auto_cleanup_expired_tokens();

-- Add updated_at trigger
CREATE TRIGGER update_password_reset_tokens_updated_at
BEFORE UPDATE ON public.password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();