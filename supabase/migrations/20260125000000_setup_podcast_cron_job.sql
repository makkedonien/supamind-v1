-- Migration: Set up scheduled podcast processing cron job
-- File: supabase/migrations/20260125000000_setup_podcast_cron_job.sql

BEGIN;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing podcast processing cron job to avoid duplicates
SELECT cron.unschedule('scheduled-podcast-processing');

-- Schedule the podcast processing function to run daily at 10:00 AM UTC
-- The cron schedule '0 10 * * *' means:
-- - 0 minutes
-- - 10 hours (10 AM)
-- - every day of month (*)
-- - every month (*)
-- - every day of week (*)
SELECT cron.schedule(
    'scheduled-podcast-processing',
    '0 10 * * *',
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
