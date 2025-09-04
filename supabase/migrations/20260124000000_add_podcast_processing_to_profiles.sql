-- Migration: Add podcast_processing field to profiles table
-- File: supabase/migrations/20260124000000_add_podcast_processing_to_profiles.sql

BEGIN;

-- Create enum type for podcast processing settings
DO $$ BEGIN
    CREATE TYPE podcast_processing_setting AS ENUM ('disabled', 'enabled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add podcast_processing column to profiles table with default value 'disabled'
ALTER TABLE public.profiles 
ADD COLUMN podcast_processing podcast_processing_setting DEFAULT 'disabled';

-- Update existing users to have podcast processing disabled by default
UPDATE public.profiles 
SET podcast_processing = 'disabled'
WHERE podcast_processing IS NULL;

COMMIT;



