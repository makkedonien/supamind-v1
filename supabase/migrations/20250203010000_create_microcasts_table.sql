-- Create microcasts table for audio podcasts generated from feed sources
CREATE TABLE IF NOT EXISTS public.microcasts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    source_ids text[] NOT NULL DEFAULT '{}',
    audio_url text,
    audio_expires_at timestamp with time zone,
    generation_status text DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_microcasts_user_id ON public.microcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_microcasts_created_at ON public.microcasts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_microcasts_generation_status ON public.microcasts(generation_status);

-- Enable Row Level Security
ALTER TABLE public.microcasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for microcasts
DROP POLICY IF EXISTS "Users can view their own microcasts" ON public.microcasts;
CREATE POLICY "Users can view their own microcasts"
    ON public.microcasts FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own microcasts" ON public.microcasts;
CREATE POLICY "Users can create their own microcasts"
    ON public.microcasts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own microcasts" ON public.microcasts;
CREATE POLICY "Users can update their own microcasts"
    ON public.microcasts FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own microcasts" ON public.microcasts;
CREATE POLICY "Users can delete their own microcasts"
    ON public.microcasts FOR DELETE
    USING (auth.uid() = user_id);

-- Add updated_at trigger for microcasts
CREATE TRIGGER update_microcasts_updated_at
    BEFORE UPDATE ON public.microcasts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for microcasts
ALTER TABLE public.microcasts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.microcasts;

-- Update storage policies for microcast audio files
-- Allow users to access audio files for their own microcasts
CREATE POLICY "Users can view their own microcast audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'microcasts' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM microcasts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own microcast audio files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'microcasts' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM microcasts WHERE user_id = auth.uid()
  )
);