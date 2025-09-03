-- Migration: Add transcript_api_key field to profiles table
-- File: supabase/migrations/20260123000000_add_transcript_api_key_to_profiles.sql

BEGIN;

-- Add transcript_api_key column for user-owned API keys from third-party transcription services
ALTER TABLE public.profiles 
ADD COLUMN transcript_api_key text;

COMMIT;
