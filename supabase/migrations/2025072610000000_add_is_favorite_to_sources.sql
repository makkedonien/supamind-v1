-- Add is_favorite field to sources table
ALTER TABLE public.sources 
ADD COLUMN is_favorite boolean DEFAULT false NOT NULL;

-- Create index for faster queries on favorites
CREATE INDEX IF NOT EXISTS idx_sources_is_favorite ON public.sources(is_favorite);

-- Create index for user favorites (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_sources_user_favorite ON public.sources(user_id, is_favorite) WHERE is_favorite = true; 