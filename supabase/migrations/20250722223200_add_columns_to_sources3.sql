-- Migration: Add category columns to sources table

BEGIN;

-- Remove category column
ALTER TABLE public.sources 
DROP COLUMN category;

-- Add category column
ALTER TABLE public.sources 
ADD COLUMN category text[] DEFAULT '{}';

COMMIT;