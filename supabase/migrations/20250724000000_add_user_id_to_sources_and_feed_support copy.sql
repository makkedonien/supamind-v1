-- ============================================================================
-- MIGRATION: Add user_id to sources table and enable feed sources support
-- This migration enables sources to be owned directly by users (feed sources)
-- while maintaining backward compatibility with notebook-owned sources
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Add user_id column to sources table
-- ============================================================================

-- Add user_id column (nullable initially to populate existing data)
ALTER TABLE public.sources 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Populate user_id for existing notebook sources
-- ============================================================================

-- Update existing sources to have user_id based on their notebook ownership
UPDATE public.sources 
SET user_id = notebooks.user_id 
FROM public.notebooks 
WHERE sources.notebook_id = notebooks.id;

-- ============================================================================
-- STEP 3: Make schema changes for feed sources support
-- ============================================================================

-- Make user_id NOT NULL now that existing data is populated
ALTER TABLE public.sources 
ALTER COLUMN user_id SET NOT NULL;

-- Make notebook_id nullable to support feed sources
ALTER TABLE public.sources 
ALTER COLUMN notebook_id DROP NOT NULL;

-- ============================================================================
-- STEP 4: Add indexes for performance
-- ============================================================================

-- Index for user-based queries (primary use case for feed sources)
CREATE INDEX IF NOT EXISTS idx_sources_user_id 
ON public.sources(user_id);

-- Composite index for user + notebook queries
CREATE INDEX IF NOT EXISTS idx_sources_user_notebook 
ON public.sources(user_id, notebook_id);

-- Index specifically for feed sources (user_id with null notebook_id)
CREATE INDEX IF NOT EXISTS idx_sources_feed 
ON public.sources(user_id, created_at DESC) 
WHERE notebook_id IS NULL;

-- Index for notebook sources (existing functionality)
CREATE INDEX IF NOT EXISTS idx_sources_notebook_user 
ON public.sources(notebook_id, user_id) 
WHERE notebook_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Add database constraints for data integrity
-- ============================================================================

-- Add function to validate source-notebook ownership consistency
CREATE OR REPLACE FUNCTION public.validate_source_notebook_ownership()
RETURNS TRIGGER AS $$
BEGIN
  -- If notebook_id is provided, ensure the notebook belongs to the same user
  IF NEW.notebook_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.notebooks 
      WHERE id = NEW.notebook_id AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Source user_id must match notebook owner user_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce ownership consistency
DROP TRIGGER IF EXISTS source_ownership_consistency_check ON public.sources;
CREATE TRIGGER source_ownership_consistency_check
  BEFORE INSERT OR UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION public.validate_source_notebook_ownership();

-- ============================================================================
-- STEP 6: Update RLS policies for new schema
-- ============================================================================

-- Drop old policies that only worked with notebook ownership
DROP POLICY IF EXISTS "Users can view sources from their notebooks" ON public.sources;
DROP POLICY IF EXISTS "Users can create sources in their notebooks" ON public.sources;
DROP POLICY IF EXISTS "Users can update sources in their notebooks" ON public.sources;
DROP POLICY IF EXISTS "Users can delete sources from their notebooks" ON public.sources;

-- Create new unified policies that work for both notebook and feed sources
CREATE POLICY "Users can view their own sources"
  ON public.sources FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sources"
  ON public.sources FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sources"
  ON public.sources FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sources"
  ON public.sources FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- STEP 7: Update storage policies for feed sources
-- ============================================================================

-- Add policy for viewing feed source files
CREATE POLICY "Users can view their own feed source files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] = 'feed' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Add policy for uploading feed source files
CREATE POLICY "Users can upload feed source files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] = 'feed' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Add policy for updating feed source files
CREATE POLICY "Users can update their own feed source files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] = 'feed' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Add policy for deleting feed source files
CREATE POLICY "Users can delete their own feed source files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] = 'feed' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
);

-- Update existing notebook source storage policies to be more flexible
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own source files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload source files to their notebooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own source files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own source files" ON storage.objects;

-- Create new notebook source storage policies that work with user_id
CREATE POLICY "Users can view their notebook source files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] != 'feed' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.notebooks WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload notebook source files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] != 'feed' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.notebooks WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their notebook source files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] != 'feed' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.notebooks WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their notebook source files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sources' AND
  (storage.foldername(name))[1] != 'feed' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.notebooks WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 8: Add helpful database functions
-- ============================================================================

-- Function to get all sources for a user (both feed and notebook sources)
CREATE OR REPLACE FUNCTION public.get_user_sources(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  type source_type,
  url text,
  file_path text,
  content text,
  summary text,
  processing_status text,
  notebook_id uuid,
  notebook_title text,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT 
    s.id,
    s.title,
    s.type,
    s.url,
    s.file_path,
    s.content,
    s.summary,
    s.processing_status,
    s.notebook_id,
    n.title as notebook_title,
    s.created_at
  FROM public.sources s
  LEFT JOIN public.notebooks n ON s.notebook_id = n.id
  WHERE s.user_id = target_user_id
  ORDER BY s.created_at DESC;
$$;

-- Function to check if a user owns a source (for additional validation)
CREATE OR REPLACE FUNCTION public.user_owns_source(source_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.sources 
    WHERE id = source_id_param 
    AND user_id = auth.uid()
  );
$$;

-- ============================================================================
-- STEP 9: Update realtime subscription configuration
-- ============================================================================

-- Ensure sources table has proper replica identity for realtime
ALTER TABLE public.sources REPLICA IDENTITY FULL;

-- Sources table should already be in the realtime publication, but let's ensure it
DO $$
BEGIN
  -- Add to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'sources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sources;
  END IF;
END
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================

/*
-- Check that all sources now have user_id
SELECT COUNT(*) as total_sources, 
       COUNT(user_id) as sources_with_user_id,
       COUNT(notebook_id) as sources_with_notebook_id
FROM public.sources;

-- Check feed sources (should be 0 initially)
SELECT COUNT(*) as feed_sources 
FROM public.sources 
WHERE notebook_id IS NULL;

-- Check notebook sources still work
SELECT COUNT(*) as notebook_sources 
FROM public.sources 
WHERE notebook_id IS NOT NULL;

-- Verify ownership consistency
SELECT s.id, s.user_id as source_user, n.user_id as notebook_user
FROM public.sources s
JOIN public.notebooks n ON s.notebook_id = n.id
WHERE s.user_id != n.user_id; -- Should return 0 rows

-- Test the new function
SELECT * FROM public.get_user_sources(auth.uid()) LIMIT 5;
*/