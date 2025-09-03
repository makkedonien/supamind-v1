-- ============================================================================
-- MIGRATION: Add pod_episode_id column to sources table
-- Description: Adds a pod_episode_id column to the sources table to store
-- podcast episode GUIDs from RSS feeds for tracking individual episodes
-- ============================================================================

BEGIN;

-- Add pod_episode_id column to sources table (text field, nullable)
ALTER TABLE public.sources 
ADD COLUMN pod_episode_id text;

-- Add index on pod_episode_id for performance (useful for lookups by episode GUID)
CREATE INDEX IF NOT EXISTS idx_sources_pod_episode_id 
ON public.sources(pod_episode_id) 
WHERE pod_episode_id IS NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================
-- 
-- -- Check that the column was added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sources' AND column_name = 'pod_episode_id';
-- 
-- -- Check that the index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'sources' AND indexname = 'idx_sources_pod_episode_id';
