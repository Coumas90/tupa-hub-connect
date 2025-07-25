-- Create giveaway_winners table to track weekly winners
CREATE TABLE public.giveaway_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL,
  cafe_id UUID NOT NULL,
  region VARCHAR(100),
  prize_code VARCHAR(50) NOT NULL UNIQUE,
  prize_description TEXT DEFAULT 'Weekly Giveaway Prize',
  week_of DATE NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.giveaway_winners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all giveaway winners" 
ON public.giveaway_winners 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Cafe owners can view their cafe winners" 
ON public.giveaway_winners 
FOR SELECT 
USING (is_cafe_owner(auth.uid(), cafe_id));

CREATE POLICY "Winners can view their own wins"
ON public.giveaway_winners
FOR SELECT
USING (
  participant_id IN (
    SELECT gp.id FROM giveaway_participants gp 
    WHERE gp.customer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Add foreign key relationships
ALTER TABLE public.giveaway_winners 
ADD CONSTRAINT fk_giveaway_winners_participant 
FOREIGN KEY (participant_id) REFERENCES public.giveaway_participants(id);

ALTER TABLE public.giveaway_winners 
ADD CONSTRAINT fk_giveaway_winners_cafe 
FOREIGN KEY (cafe_id) REFERENCES public.cafes(id);

-- Create indexes for better performance
CREATE INDEX idx_giveaway_winners_week_of ON public.giveaway_winners(week_of);
CREATE INDEX idx_giveaway_winners_cafe_id ON public.giveaway_winners(cafe_id);
CREATE INDEX idx_giveaway_winners_selected_at ON public.giveaway_winners(selected_at);

-- Create function to generate unique prize codes
CREATE OR REPLACE FUNCTION generate_prize_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a code like "TUPA2024W03-ABC123"
    code := 'TUPA' || 
            EXTRACT(YEAR FROM CURRENT_DATE) || 
            'W' || LPAD(EXTRACT(WEEK FROM CURRENT_DATE)::TEXT, 2, '0') || 
            '-' || 
            UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM giveaway_winners WHERE prize_code = code) INTO exists_check;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_giveaway_winners_updated_at
  BEFORE UPDATE ON public.giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for audit fields
CREATE TRIGGER handle_giveaway_winners_audit_fields
  BEFORE INSERT OR UPDATE ON public.giveaway_winners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_fields();