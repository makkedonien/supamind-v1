-- ============================================================================
-- Migration: Add 'podcast' to source_type enum
-- Description: Adds 'podcast' as a new option to the source_type enum used by
-- the sources table to support podcast episodes as source content.
-- ============================================================================

BEGIN;

-- Add 'podcast' as a new value to the source_type enum
ALTER TYPE source_type ADD VALUE 'podcast';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually to verify the migration worked)
-- ============================================================================
-- 
-- -- Check that the enum now includes 'podcast'
-- SELECT enumlabel 
-- FROM pg_enum 
-- JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
-- WHERE pg_type.typname = 'source_type' 
-- ORDER BY enumsortorder;
-- 
-- -- Verify the sources table can now accept 'podcast' type
-- -- (This should not produce an error)
-- -- SELECT * FROM public.sources WHERE type = 'podcast';
