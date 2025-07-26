-- Fix Security Definer View issue
-- Drop and recreate the giveaway_winner_stats view as a regular view (not SECURITY DEFINER)

DROP VIEW IF EXISTS public.giveaway_winner_stats;

-- Create a regular view for giveaway winner statistics
CREATE VIEW public.giveaway_winner_stats AS
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