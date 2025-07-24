-- Create cafes table for cafe owners
CREATE TABLE IF NOT EXISTS public.cafes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(owner_id)
);

-- Create feedbacks table
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id uuid REFERENCES public.cafes(id) ON DELETE CASCADE NOT NULL,
  customer_name text,
  customer_email text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Create auth groups/roles
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'cafe_owner' FROM auth.users 
WHERE id IN (SELECT owner_id FROM public.cafes)
ON CONFLICT (user_id) DO NOTHING;

-- Function to check if user is cafe owner of specific cafe
CREATE OR REPLACE FUNCTION public.is_cafe_owner(_user_id uuid, _cafe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.cafes 
    WHERE id = _cafe_id AND owner_id = _user_id
  );
$$;

-- Function to get user's cafe ID
CREATE OR REPLACE FUNCTION public.get_user_cafe_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.cafes WHERE owner_id = _user_id;
$$;

-- RLS Policies for cafes table
-- Cafe owners can access their own cafe data
CREATE POLICY "Cafe owners can access own cafe" 
ON public.cafes 
FOR ALL 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Admins can access all cafes
CREATE POLICY "Admins can access all cafes" 
ON public.cafes 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Public can view basic cafe info
CREATE POLICY "Public can view cafes" 
ON public.cafes 
FOR SELECT 
TO anon
USING (true);

-- RLS Policies for feedbacks table
-- Cafe owners can view feedbacks for their cafe (auth.uid() = cafe_id logic via function)
CREATE POLICY "Cafe owners can view own cafe feedbacks" 
ON public.feedbacks 
FOR SELECT 
TO authenticated
USING (public.is_cafe_owner(auth.uid(), cafe_id));

-- Cafe owners can manage feedbacks for their cafe
CREATE POLICY "Cafe owners can manage own cafe feedbacks" 
ON public.feedbacks 
FOR ALL 
TO authenticated
USING (public.is_cafe_owner(auth.uid(), cafe_id))
WITH CHECK (public.is_cafe_owner(auth.uid(), cafe_id));

-- Admins can access all feedbacks
CREATE POLICY "Admins can access all feedbacks" 
ON public.feedbacks 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Anonymous users can only INSERT feedbacks (no access to other records)
CREATE POLICY "Anonymous can insert feedbacks only" 
ON public.feedbacks 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Authenticated users can insert feedbacks
CREATE POLICY "Authenticated can insert feedbacks" 
ON public.feedbacks 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cafes_owner_id ON public.cafes(owner_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_cafe_id ON public.feedbacks(cafe_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON public.feedbacks(created_at DESC);