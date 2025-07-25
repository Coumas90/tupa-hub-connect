-- Enable real-time for feedbacks table
ALTER TABLE public.feedbacks REPLICA IDENTITY FULL;

-- Add the feedbacks table to the realtime publication
-- This allows real-time subscriptions to work
DO $$ 
BEGIN 
  -- Check if publication exists, create if not
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  -- Add feedbacks table to the publication
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
EXCEPTION 
  WHEN duplicate_object THEN 
    -- Table already in publication, ignore
    NULL;
END $$;