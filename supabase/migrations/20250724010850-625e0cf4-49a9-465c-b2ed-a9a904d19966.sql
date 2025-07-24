-- Create giveaway_participants table
CREATE TABLE IF NOT EXISTS public.giveaway_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid REFERENCES public.cafes(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  phone text,
  participated_at timestamp with time zone DEFAULT now(),
  campaign_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on giveaway_participants
ALTER TABLE public.giveaway_participants ENABLE ROW LEVEL SECURITY;

-- Add QR-related columns to cafes table
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS qr_code_url text;
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS brand_color text DEFAULT '#8B5CF6';
ALTER TABLE public.cafes ADD COLUMN IF NOT EXISTS qr_generated_at timestamp with time zone;

-- RLS Policies for giveaway_participants
-- Cafe owners can view participants for their cafe
CREATE POLICY "Cafe owners can view own cafe participants" 
ON public.giveaway_participants 
FOR SELECT 
TO authenticated
USING (public.is_cafe_owner(auth.uid(), cafe_id));

-- Cafe owners can manage participants for their cafe
CREATE POLICY "Cafe owners can manage own cafe participants" 
ON public.giveaway_participants 
FOR ALL 
TO authenticated
USING (public.is_cafe_owner(auth.uid(), cafe_id))
WITH CHECK (public.is_cafe_owner(auth.uid(), cafe_id));

-- Admins can access all participants
CREATE POLICY "Admins can access all participants" 
ON public.giveaway_participants 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Anonymous and authenticated users can insert participants
CREATE POLICY "Anyone can insert participants" 
ON public.giveaway_participants 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_cafe_id ON public.giveaway_participants(cafe_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_email ON public.giveaway_participants(customer_email);
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_campaign ON public.giveaway_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_cafes_qr_generated ON public.cafes(qr_generated_at DESC);