-- Migration: Allow admins to update user approvals
-- File: supabase/migrations/20251027000002_allow_admin_approval_updates.sql

BEGIN;

-- ============================================================================
-- HELPER FUNCTION FOR ADMIN ROLE CHECK
-- ============================================================================

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT user_role FROM public.profiles WHERE id = auth.uid()) = 'admin',
        false
    );
$$;

-- ============================================================================
-- ADD RLS POLICY FOR ADMIN APPROVAL UPDATES
-- ============================================================================

-- Allow admins to view all profiles (needed to see unapproved users)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_user_admin());

-- Allow admins to update any profile's admin_approval field
DROP POLICY IF EXISTS "Admins can update user approvals" ON public.profiles;
CREATE POLICY "Admins can update user approvals"
    ON public.profiles FOR UPDATE
    USING (public.is_user_admin());

COMMIT;


