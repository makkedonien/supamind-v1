-- Migration: Add onboarding_dialogues JSONB column to profiles table

BEGIN;

-- Add onboarding_dialogues column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_dialogues jsonb DEFAULT '{
  "feed_dialogue": false,
  "microcast_dialogue": false,
  "podcast_dialogue": false,
  "settings_dialogue": false
}'::jsonb;

-- Update existing users to have the default onboarding dialogues state
UPDATE public.profiles 
SET onboarding_dialogues = '{
  "feed_dialogue": false,
  "microcast_dialogue": false,
  "podcast_dialogue": false,
  "settings_dialogue": false
}'::jsonb
WHERE onboarding_dialogues IS NULL;

COMMIT;

