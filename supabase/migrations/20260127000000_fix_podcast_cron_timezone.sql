-- Migration: Fix podcast cron job timezone for Central Time
-- File: supabase/migrations/20260127000000_fix_podcast_cron_timezone.sql

BEGIN;

-- Remove the existing cron job (ignore if it doesn't exist)
DO $$
BEGIN
    PERFORM cron.unschedule('scheduled-podcast-processing');
EXCEPTION
    WHEN OTHERS THEN
        -- Job doesn't exist, that's fine
        NULL;
END $$;

-- Schedule the podcast processing function to run daily at 10:00 AM Central Time
-- Central Standard Time (CST) is UTC-6, so 10:00 AM CST = 16:00 UTC (4:00 PM UTC)
-- Central Daylight Time (CDT) is UTC-5, so 10:00 AM CDT = 15:00 UTC (3:00 PM UTC)
-- We'll use 15:00 UTC (3:00 PM UTC) to account for daylight saving time most of the year
-- The cron schedule '0 15 * * *' means:
-- - 0 minutes
-- - 15 hours (3:00 PM UTC = 10:00 AM CDT)
-- - every day of month (*)
-- - every month (*)
-- - every day of week (*)
SELECT cron.schedule(
    'scheduled-podcast-processing',
    '0 15 * * *',
    $$
    SELECT
      net.http_post(
          url:='https://ehqdibhqhevjnknojogm.supabase.co/functions/v1/scheduled-podcast-processing',
          headers:=jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body:=jsonb_build_object()
      ) as request_id;
    $$
);

COMMIT;
