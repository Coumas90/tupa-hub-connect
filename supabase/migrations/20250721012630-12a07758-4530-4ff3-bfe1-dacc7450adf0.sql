-- Add missing columns to consumptions table
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS client_id TEXT NOT NULL DEFAULT '';
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS total_items INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS average_order_value NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS top_categories TEXT[] DEFAULT '{}';
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '{}';
ALTER TABLE public.consumptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_consumptions_client_date ON public.consumptions(client_id, date);
CREATE INDEX IF NOT EXISTS idx_consumptions_location ON public.consumptions(location_id);

-- Enable Row Level Security
ALTER TABLE public.consumptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view consumptions" 
ON public.consumptions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert consumptions" 
ON public.consumptions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update consumptions" 
ON public.consumptions 
FOR UPDATE 
USING (true);