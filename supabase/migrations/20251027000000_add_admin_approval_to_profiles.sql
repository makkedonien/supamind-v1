-- Migration: Add admin approval and user role fields to profiles table
-- File: supabase/migrations/20251027000000_add_admin_approval_to_profiles.sql

BEGIN;

-- Add admin_approval column (default false - requires manual approval)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS admin_approval boolean DEFAULT false;

-- Add user_role column (default 'standard')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_role text DEFAULT 'standard';

-- Update existing users to have approval set to true (grandfather them in)
-- This ensures existing users aren't locked out
UPDATE public.profiles 
SET admin_approval = true
WHERE admin_approval IS NULL OR admin_approval = false;

-- Create an index for faster lookups on admin_approval
CREATE INDEX IF NOT EXISTS idx_profiles_admin_approval ON public.profiles(admin_approval);

-- Create an index for faster lookups on user_role
CREATE INDEX IF NOT EXISTS idx_profiles_user_role ON public.profiles(user_role);

COMMIT;


