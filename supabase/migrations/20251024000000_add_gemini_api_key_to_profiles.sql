-- Migration: Add gemini_api_key field to profiles table
-- File: supabase/migrations/20251024000000_add_gemini_api_key_to_profiles.sql

BEGIN;

-- Add gemini_api_key column for user-owned Gemini API keys
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key text;

COMMIT;

