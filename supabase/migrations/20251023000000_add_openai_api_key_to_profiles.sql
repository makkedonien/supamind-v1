-- Migration: Add openai_api_key field to profiles table
-- File: supabase/migrations/20251023000000_add_openai_api_key_to_profiles.sql

BEGIN;

-- Add openai_api_key column for user-owned OpenAI API keys
ALTER TABLE public.profiles 
ADD COLUMN openai_api_key text;

COMMIT;

