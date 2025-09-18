-- Migration: Change podcast cron job to run at 8:00 AM Central European Time
-- File: supabase/migrations/20260127000001_change_to_cet_timezone.sql

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

-- Schedule the podcast processing function to run daily at 8:00 AM Central European Time
-- Central European Time (CET) is UTC+1, so 8:00 AM CET = 7:00 AM UTC
-- Central European Summer Time (CEST) is UTC+2, so 8:00 AM CEST = 6:00 AM UTC
-- We'll use 06:00 UTC (6:00 AM UTC) to account for daylight saving time most of the year
-- The cron schedule '0 6 * * *' means:
-- - 0 minutes
-- - 6 hours (6:00 AM UTC = 8:00 AM CEST)
-- - every day of month (*)
-- - every month (*)
-- - every day of week (*)
SELECT cron.schedule(
    'scheduled-podcast-processing',
    '0 6 * * *',
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

