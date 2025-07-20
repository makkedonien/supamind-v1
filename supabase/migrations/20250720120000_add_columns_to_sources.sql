-- Migration: Add publisher_name, deep_summary, and short_description columns to sources table
-- File: supabase/migrations/YYYYMMDDHHMMSS_add_columns_to_sources.sql

BEGIN;

-- Add publisher_name column
ALTER TABLE public.sources 
ADD COLUMN publisher_name text;

-- Add short_description column  
ALTER TABLE public.sources 
ADD COLUMN short_description text;

-- Add deep_summary column
ALTER TABLE public.sources 
ADD COLUMN deep_summary text;

COMMIT;