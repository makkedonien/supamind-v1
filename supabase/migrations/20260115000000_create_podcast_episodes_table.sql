-- Create podcast_episodes table for RSS feed podcast transcripts and metadata
CREATE TABLE IF NOT EXISTS public.podcast_episodes (
    id uuid PRIMARY KEY, -- Will be populated with unique feed id (guid) format: 289dae3a-8412-11f0-92ac-9bd4e8c72f76
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    podcast_name text NOT NULL,
    title text NOT NULL,
    pubDate timestamp with time zone NOT NULL,
    link text,
    audio_url text,
    audio_file_size bigint, -- Size of the audio file in bytes
    audio_duration text, -- Format: HH:MM:SS (e.g., "00:31:01")
    content text, -- Text describing the content of the episode
    summary text, -- AI-generated summary
    processing_status text DEFAULT 'pending',
    file_path text, -- Path to stored audio file
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_user_id ON public.podcast_episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_created_at ON public.podcast_episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_pub_date ON public.podcast_episodes(pubDate DESC);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_processing_status ON public.podcast_episodes(processing_status);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_podcast_name ON public.podcast_episodes(podcast_name);

-- Enable Row Level Security
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for podcast_episodes
DROP POLICY IF EXISTS "Users can view their own podcast episodes" ON public.podcast_episodes;
CREATE POLICY "Users can view their own podcast episodes"
    ON public.podcast_episodes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own podcast episodes" ON public.podcast_episodes;
CREATE POLICY "Users can create their own podcast episodes"
    ON public.podcast_episodes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own podcast episodes" ON public.podcast_episodes;
CREATE POLICY "Users can update their own podcast episodes"
    ON public.podcast_episodes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own podcast episodes" ON public.podcast_episodes;
CREATE POLICY "Users can delete their own podcast episodes"
    ON public.podcast_episodes FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger for podcast_episodes
CREATE TRIGGER update_podcast_episodes_updated_at
    BEFORE UPDATE ON public.podcast_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
