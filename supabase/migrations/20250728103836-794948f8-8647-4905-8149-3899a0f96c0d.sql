-- Fix security issues
-- Update function to set search path explicitly
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

-- Update auto cleanup function with proper search path
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Run cleanup when inserting new tokens
  PERFORM public.cleanup_expired_password_tokens();
  RETURN NEW;
END;
$$;