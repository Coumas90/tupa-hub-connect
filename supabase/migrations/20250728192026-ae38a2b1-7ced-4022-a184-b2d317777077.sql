-- Check for any remaining security definer views and fix them

-- Query to find problematic views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND definition ILIKE '%security definer%';

-- The remaining warnings (2&3) are auth configuration issues, not database issues
-- These need to be fixed in Supabase dashboard settings:
-- 1. Reduce OTP expiry in Auth settings  
-- 2. Enable leaked password protection in Auth settings

-- For now, let's continue with the multi-tenant implementation
-- as the remaining issues are configuration, not database security