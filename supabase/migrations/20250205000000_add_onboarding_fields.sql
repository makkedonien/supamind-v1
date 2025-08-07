-- Migration: Add onboarding completion fields to profiles table

BEGIN;

-- Add onboarding completion fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_feed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_microcasts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_notebooks boolean DEFAULT false;

-- Update existing users to have onboarding not completed
UPDATE public.profiles 
SET 
  onboarding_completed_feed = false,
  onboarding_completed_microcasts = false,
  onboarding_completed_notebooks = false
WHERE 
  onboarding_completed_feed IS NULL 
  OR onboarding_completed_microcasts IS NULL 
  OR onboarding_completed_notebooks IS NULL;

COMMIT;