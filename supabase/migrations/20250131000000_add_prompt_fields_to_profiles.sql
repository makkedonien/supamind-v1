-- Migration: Add prompt fields to profiles table
-- File: supabase/migrations/20250131000000_add_prompt_fields_to_profiles.sql

BEGIN;

-- Add summary_prompt column for user-owned summary prompts
ALTER TABLE public.profiles 
ADD COLUMN summary_prompt text;

-- Add deep_dive_prompt column for user-owned deep dive prompts  
ALTER TABLE public.profiles 
ADD COLUMN deep_dive_prompt text;

-- Add categorization_prompt column for user-owned categorization prompts
ALTER TABLE public.profiles 
ADD COLUMN categorization_prompt text;

COMMIT; 