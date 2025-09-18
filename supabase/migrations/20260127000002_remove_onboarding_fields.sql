-- Migration: Remove onboarding completion fields from profiles table

BEGIN;

-- Remove onboarding completion fields from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS onboarding_completed_feed,
DROP COLUMN IF EXISTS onboarding_completed_microcasts,
DROP COLUMN IF EXISTS onboarding_completed_notebooks;

COMMIT;
