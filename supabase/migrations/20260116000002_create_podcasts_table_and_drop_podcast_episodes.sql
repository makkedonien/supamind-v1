-- Drop the existing podcast_episodes table
DROP TABLE IF EXISTS public.podcast_episodes CASCADE;

-- Create new podcasts table for RSS feed management
CREATE TABLE IF NOT EXISTS public.podcasts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rss_feed text NOT NULL,
    podcast_name text NOT NULL,
    image_url text,
    link text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_podcasts_user_id ON public.podcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_podcasts_created_at ON public.podcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcasts_podcast_name ON public.podcasts(podcast_name);
CREATE INDEX IF NOT EXISTS idx_podcasts_rss_feed ON public.podcasts(rss_feed);

-- Enable Row Level Security
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for podcasts
DROP POLICY IF EXISTS "Users can view their own podcasts" ON public.podcasts;
CREATE POLICY "Users can view their own podcasts"
    ON public.podcasts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own podcasts" ON public.podcasts;
CREATE POLICY "Users can create their own podcasts"
    ON public.podcasts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own podcasts" ON public.podcasts;
CREATE POLICY "Users can update their own podcasts"
    ON public.podcasts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own podcasts" ON public.podcasts;
CREATE POLICY "Users can delete their own podcasts"
    ON public.podcasts FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger for podcasts
CREATE TRIGGER update_podcasts_updated_at
    BEFORE UPDATE ON public.podcasts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
