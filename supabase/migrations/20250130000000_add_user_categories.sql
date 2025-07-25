-- Migration: Add user_categories table for user-owned categories

BEGIN;

-- Create user_categories table
CREATE TABLE IF NOT EXISTS public.user_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    color text DEFAULT '#6B7280', -- Default gray color
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure unique category names per user
    CONSTRAINT unique_user_category_name UNIQUE (user_id, name),
    
    -- Validate category name
    CONSTRAINT valid_category_name CHECK (char_length(trim(name)) > 0 AND char_length(name) <= 50)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_categories_user_id ON public.user_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_user_categories_name ON public.user_categories(name);

-- Enable RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own categories" ON public.user_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.user_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.user_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.user_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Add some default categories for existing users
INSERT INTO public.user_categories (user_id, name, color)
SELECT 
    profiles.id as user_id,
    unnest(ARRAY['Technology', 'Business', 'Science', 'Health', 'Education']) as name,
    unnest(ARRAY['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B']) as color
FROM public.profiles
ON CONFLICT (user_id, name) DO NOTHING;

COMMIT; 