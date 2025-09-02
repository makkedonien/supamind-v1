-- Add status field to podcasts table with default 'processing'
ALTER TABLE public.podcasts 
ADD COLUMN status text DEFAULT 'processing';

-- Create index for performance on the status field
CREATE INDEX IF NOT EXISTS idx_podcasts_status ON public.podcasts(status);
