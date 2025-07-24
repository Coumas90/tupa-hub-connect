-- Add sentiment analysis column to feedbacks table
ALTER TABLE public.feedbacks 
ADD COLUMN sentiment text;

-- Add index for better performance on sentiment queries
CREATE INDEX idx_feedbacks_sentiment ON public.feedbacks(sentiment);