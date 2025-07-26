-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job to run every Monday at 9:00 AM
-- This will automatically select winners and send notification emails
SELECT cron.schedule(
  'weekly-giveaway-selection',
  '0 9 * * 1', -- Every Monday at 9:00 AM (minute hour day_of_month month day_of_week)
  $$
  SELECT
    net.http_post(
        url:='https://hmmaubkxfewzlypywqff.supabase.co/functions/v1/weekly-giveaway-selection',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtbWF1Ymt4ZmV3emx5cHl3cWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODcwNjAsImV4cCI6MjA2ODQ2MzA2MH0.SahVxttR7FcNfYR7hEL4N-ouOrhydtvPVTkKs_o5jCg"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create a view for easy winner statistics
CREATE OR REPLACE VIEW public.giveaway_winner_stats AS
SELECT 
  DATE_TRUNC('week', selected_at) as week_start,
  COUNT(*) as winners_count,
  COUNT(DISTINCT region) as regions_count,
  COUNT(CASE WHEN email_status = 'sent' THEN 1 END) as emails_sent,
  COUNT(CASE WHEN email_status = 'failed' THEN 1 END) as emails_failed,
  COUNT(CASE WHEN email_status = 'pending' THEN 1 END) as emails_pending
FROM public.giveaway_winners
GROUP BY DATE_TRUNC('week', selected_at)
ORDER BY week_start DESC;