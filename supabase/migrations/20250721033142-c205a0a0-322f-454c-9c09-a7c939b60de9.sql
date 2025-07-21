-- Create refresh tokens table for token rotation security
CREATE TABLE public.refresh_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_info JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  parent_token_hash TEXT -- For token family tracking
);

-- Create index for performance
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON public.refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for refresh tokens
CREATE POLICY "Users can view their own refresh tokens"
ON public.refresh_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage refresh tokens"
ON public.refresh_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.refresh_tokens 
  WHERE expires_at < now() OR is_revoked = true;
END;
$$;

-- Function to revoke all user sessions (for security breaches)
CREATE OR REPLACE FUNCTION public.revoke_all_user_sessions(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.refresh_tokens 
  SET is_revoked = true, revoked_at = now()
  WHERE user_id = target_user_id AND is_revoked = false;
END;
$$;

-- Function to enforce session limit per user
CREATE OR REPLACE FUNCTION public.enforce_session_limit(target_user_id UUID, max_sessions INTEGER DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Revoke oldest sessions if limit exceeded
  WITH oldest_sessions AS (
    SELECT id FROM public.refresh_tokens
    WHERE user_id = target_user_id 
    AND is_revoked = false 
    AND expires_at > now()
    ORDER BY last_used_at ASC
    OFFSET max_sessions
  )
  UPDATE public.refresh_tokens 
  SET is_revoked = true, revoked_at = now()
  WHERE id IN (SELECT id FROM oldest_sessions);
END;
$$;

-- Trigger to update timestamps
CREATE TRIGGER update_refresh_tokens_updated_at
BEFORE UPDATE ON public.refresh_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();