-- ============================================================================
-- MIGRATION: Remove transcript column from sources table
-- Drops the transcript text field from sources
-- ============================================================================

BEGIN;

-- Drop transcript column
ALTER TABLE public.sources 
DROP COLUMN IF EXISTS transcript;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================
-- 
-- -- Check that the column was removed successfully
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sources' 
-- AND column_name = 'transcript';
-- 
-- -- This should return no rows if the column was successfully dropped

