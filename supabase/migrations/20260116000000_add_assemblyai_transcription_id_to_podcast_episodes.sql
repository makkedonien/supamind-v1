-- Add assemblyai_transcription_id field to podcast_episodes table
ALTER TABLE public.podcast_episodes 
ADD COLUMN IF NOT EXISTS assemblyai_transcription_id text;
