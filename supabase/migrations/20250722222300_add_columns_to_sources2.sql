-- Migration: Add category columns to sources table

BEGIN;

-- Add category column
ALTER TABLE public.sources 
ADD COLUMN category jsonb DEFAULT '{}';

COMMIT;