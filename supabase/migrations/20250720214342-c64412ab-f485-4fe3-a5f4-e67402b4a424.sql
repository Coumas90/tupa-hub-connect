-- Create groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_main BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table if it doesn't exist, or alter if it does
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add group_id and location_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id),
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Create recipes table if it doesn't exist, or alter if it does
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add location_id to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Create consumptions table if it doesn't exist, or alter if it does
CREATE TABLE IF NOT EXISTS public.consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add location_id to consumptions table
ALTER TABLE public.consumptions 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_locations_group_id ON public.locations(group_id);
CREATE INDEX IF NOT EXISTS idx_users_group_id ON public.users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_location_id ON public.users(location_id);
CREATE INDEX IF NOT EXISTS idx_recipes_location_id ON public.recipes(location_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_location_id ON public.consumptions(location_id);

-- Enable RLS on new tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for groups
CREATE POLICY "Authenticated users can read groups" 
ON public.groups 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage their groups" 
ON public.groups 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for locations
CREATE POLICY "Authenticated users can read locations" 
ON public.locations 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can manage locations" 
ON public.locations 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure only one main location per group
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_main_per_group 
ON public.locations(group_id) 
WHERE is_main = true;