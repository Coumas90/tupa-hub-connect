-- Create pending_reviews table for comment moderation
CREATE TABLE public.pending_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedbacks(id) ON DELETE CASCADE,
  original_comment TEXT NOT NULL,
  toxicity_score NUMERIC,
  sentiment_result TEXT,
  needs_validation BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.pending_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for pending_reviews
CREATE POLICY "Admins can manage all reviews" 
ON public.pending_reviews 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own reviews" 
ON public.pending_reviews 
FOR SELECT 
USING (feedback_id IN (
  SELECT id FROM public.feedbacks WHERE customer_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
));

-- Add trigger for audit fields
CREATE TRIGGER handle_pending_reviews_audit
BEFORE INSERT OR UPDATE ON public.pending_reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_fields();

-- Add trigger for updated_at
CREATE TRIGGER update_pending_reviews_updated_at
BEFORE UPDATE ON public.pending_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_pending_reviews_feedback_id ON public.pending_reviews(feedback_id);
CREATE INDEX idx_pending_reviews_needs_validation ON public.pending_reviews(needs_validation);
CREATE INDEX idx_pending_reviews_is_approved ON public.pending_reviews(is_approved);
CREATE INDEX idx_pending_reviews_toxicity_score ON public.pending_reviews(toxicity_score);

-- Add comment_status to feedbacks table for tracking moderation state
ALTER TABLE public.feedbacks 
ADD COLUMN comment_status TEXT DEFAULT 'pending' CHECK (comment_status IN ('pending', 'approved', 'rejected', 'under_review'));