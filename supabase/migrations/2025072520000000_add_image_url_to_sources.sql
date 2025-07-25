-- Migration: Add image_url field to sources table
-- This field will store image URLs from web articles and other sources where images are available

BEGIN;

-- Add image_url column to sources table
ALTER TABLE public.sources 
ADD COLUMN image_url text;

-- Add comment to describe the field
COMMENT ON COLUMN public.sources.image_url IS 'URL of the main image associated with the source, typically from web articles';

-- Create index on image_url for potential filtering/queries
CREATE INDEX IF NOT EXISTS idx_sources_image_url 
ON public.sources(image_url) 
WHERE image_url IS NOT NULL;

COMMIT; 