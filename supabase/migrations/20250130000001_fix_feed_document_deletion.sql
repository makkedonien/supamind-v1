-- ============================================================================
-- MIGRATION: Fix feed document deletion by updating RLS policies
-- This migration fixes the issue where feed documents cannot be deleted
-- because the RLS policy only checks for notebook ownership, but feed sources
-- don't have notebook_id in their metadata.
-- ============================================================================

BEGIN;

-- Update the function to handle both notebook sources and feed sources
CREATE OR REPLACE FUNCTION public.is_notebook_owner_for_document(doc_metadata jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        -- Check if this is a notebook source (has notebook_id)
        CASE 
            WHEN doc_metadata->>'notebook_id' IS NOT NULL THEN
                -- For notebook sources: check notebook ownership
                EXISTS (
                    SELECT 1 
                    FROM public.notebooks 
                    WHERE id = (doc_metadata->>'notebook_id')::uuid 
                    AND user_id = auth.uid()
                )
            ELSE
                -- For feed sources (no notebook_id): check direct user ownership
                (doc_metadata->>'user_id')::uuid = auth.uid()
        END;
$$;

COMMIT; 