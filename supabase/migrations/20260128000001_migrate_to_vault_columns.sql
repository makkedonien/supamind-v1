-- Migration: Migrate API key columns to use Vault
-- File: supabase/migrations/20260128000001_migrate_to_vault_columns.sql

BEGIN;

-- Add new columns to store vault secret UUIDs
ALTER TABLE public.profiles 
ADD COLUMN transcript_key_vault_secret uuid,
ADD COLUMN openai_key_vault_secret uuid,
ADD COLUMN gemini_key_vault_secret uuid;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.transcript_key_vault_secret IS 'UUID of the vault secret storing the transcript API key (e.g., AssemblyAI)';
COMMENT ON COLUMN public.profiles.openai_key_vault_secret IS 'UUID of the vault secret storing the OpenAI API key';
COMMENT ON COLUMN public.profiles.gemini_key_vault_secret IS 'UUID of the vault secret storing the Gemini API key';

-- Drop old plain-text API key columns
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS transcript_api_key,
DROP COLUMN IF EXISTS openai_api_key,
DROP COLUMN IF EXISTS gemini_api_key;

COMMIT;

