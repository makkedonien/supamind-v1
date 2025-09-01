-- ============================================================================
-- MIGRATION: Add transcription and publishing date fields to sources table
-- Adds transcription_id, transcript, and publishing_date columns
-- ============================================================================

BEGIN;

-- Add transcription_id column
ALTER TABLE public.sources 
ADD COLUMN transcription_id text;

-- Add transcript column
ALTER TABLE public.sources 
ADD COLUMN transcript text;

-- Add publishing_date column
ALTER TABLE public.sources 
ADD COLUMN publishing_date timestamp with time zone;

-- Add index on transcription_id for performance (if we need to query by it)
CREATE INDEX IF NOT EXISTS idx_sources_transcription_id 
ON public.sources(transcription_id) 
WHERE transcription_id IS NOT NULL;

-- Add index on publishing_date for performance (useful for date-based queries)
CREATE INDEX IF NOT EXISTS idx_sources_publishing_date 
ON public.sources(publishing_date) 
WHERE publishing_date IS NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================
-- 
-- -- Check that the columns were added successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sources' 
-- AND column_name IN ('transcription_id', 'transcript', 'publishing_date');
-- 
-- -- Check that the indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'sources' 
-- AND indexname IN ('idx_sources_transcription_id', 'idx_sources_publishing_date');
