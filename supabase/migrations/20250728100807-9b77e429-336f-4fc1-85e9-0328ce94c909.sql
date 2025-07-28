-- Create advisory requests table
CREATE TABLE public.advisory_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,
  company_name TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '200+')),
  advisory_type TEXT NOT NULL CHECK (advisory_type IN ('menu_optimization', 'operations', 'training', 'marketing', 'equipment', 'sustainability')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  preferred_date DATE,
  preferred_time TIME,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  admin_notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create advisory visibility configuration table
CREATE TABLE public.advisory_visibility_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cafe_id UUID NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(cafe_id)
);

-- Enable RLS
ALTER TABLE public.advisory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisory_visibility_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for advisory_requests
CREATE POLICY "Admins can manage all advisory requests"
ON public.advisory_requests
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Cafe owners can view requests for visible cafes"
ON public.advisory_requests
FOR SELECT
USING (
  is_cafe_owner(auth.uid(), cafe_id) 
  AND EXISTS (
    SELECT 1 FROM public.advisory_visibility_config 
    WHERE cafe_id = advisory_requests.cafe_id 
    AND is_visible = true
  )
);

CREATE POLICY "Anyone can create advisory requests"
ON public.advisory_requests
FOR INSERT
WITH CHECK (true);

-- RLS policies for advisory_visibility_config
CREATE POLICY "Admins can manage visibility config"
ON public.advisory_visibility_config
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Cafe owners can view their visibility config"
ON public.advisory_visibility_config
FOR SELECT
USING (is_cafe_owner(auth.uid(), cafe_id));

-- Create trigger for updated_at columns
CREATE TRIGGER update_advisory_requests_updated_at
BEFORE UPDATE ON public.advisory_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advisory_visibility_config_updated_at
BEFORE UPDATE ON public.advisory_visibility_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER advisory_requests_audit_trigger
BEFORE INSERT OR UPDATE ON public.advisory_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_audit_fields();

CREATE TRIGGER advisory_visibility_config_audit_trigger
BEFORE INSERT OR UPDATE ON public.advisory_visibility_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_audit_fields();

-- Insert default visibility config for existing cafes
INSERT INTO public.advisory_visibility_config (cafe_id, is_visible, created_by)
SELECT id, true, owner_id
FROM public.cafes
ON CONFLICT (cafe_id) DO NOTHING;