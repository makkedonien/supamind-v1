-- ============================================================================
-- ROLLBACK MIGRATION: Revert feed document deletion fix
-- This migration reverts the changes made in 20250130000001_fix_feed_document_deletion.sql
-- ============================================================================

BEGIN;

-- Restore the original function that only checks for notebook ownership
CREATE OR REPLACE FUNCTION public.is_notebook_owner_for_document(doc_metadata jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.notebooks 
        WHERE id = (doc_metadata->>'notebook_id')::uuid 
        AND user_id = auth.uid()
    );
$$;

COMMIT; 