-- Add auditing columns to existing tables
ALTER TABLE public.recipes 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

ALTER TABLE public.consumptions 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Create clients table if it doesn't exist (for auditing)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create orders table if it doesn't exist (for auditing)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  location_id UUID REFERENCES public.locations(id),
  total_amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Authenticated users can manage clients" 
ON public.clients 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create RLS policies for orders
CREATE POLICY "Authenticated users can manage orders" 
ON public.orders 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to automatically set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Set created_by on INSERT
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
  END IF;
  
  -- Set updated_by on UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit field population
CREATE TRIGGER audit_recipes
  BEFORE INSERT OR UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER audit_consumptions
  BEFORE INSERT OR UPDATE ON public.consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER audit_clients
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER audit_orders
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();

-- Add triggers for updated_at columns on new tables
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();