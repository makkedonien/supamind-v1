-- ============================================================================
-- Migration: Add podcast_id column to sources table
-- Description: Adds a podcast_id column to the sources table with a foreign key
-- relation to the podcasts table to link podcast episodes to their parent podcast.
-- ============================================================================

BEGIN;

-- Add podcast_id column to sources table (nullable to allow existing records)
ALTER TABLE public.sources 
ADD COLUMN podcast_id uuid;

-- Add foreign key constraint to podcasts table
ALTER TABLE public.sources 
ADD CONSTRAINT fk_sources_podcast_id 
FOREIGN KEY (podcast_id) 
REFERENCES public.podcasts(id) 
ON DELETE CASCADE;

-- Create index for performance on the podcast_id field
CREATE INDEX IF NOT EXISTS idx_sources_podcast_id ON public.sources(podcast_id);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================
-- 
-- -- Check that the column was added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sources' AND column_name = 'podcast_id';
-- 
-- -- Check that the foreign key constraint was created
-- SELECT 
--     tc.constraint_name, 
--     tc.table_name, 
--     kcu.column_name,
--     ccu.table_name AS foreign_table_name,
--     ccu.column_name AS foreign_column_name 
-- FROM 
--     information_schema.table_constraints AS tc 
--     JOIN information_schema.key_column_usage AS kcu
--       ON tc.constraint_name = kcu.constraint_name
--     JOIN information_schema.constraint_column_usage AS ccu
--       ON ccu.constraint_name = tc.constraint_name
-- WHERE constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name='sources' 
--   AND kcu.column_name='podcast_id';
--
-- -- Check that the index was created
-- SELECT indexname 
-- FROM pg_indexes 
-- WHERE tablename = 'sources' AND indexname = 'idx_sources_podcast_id';
