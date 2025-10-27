-- Migration: Add RLS policies to restrict unapproved users
-- File: supabase/migrations/20251027000001_add_admin_approval_rls_policies.sql

BEGIN;

-- ============================================================================
-- HELPER FUNCTION FOR ADMIN APPROVAL CHECK
-- ============================================================================

-- Function to check if the current user is approved by admin
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (SELECT admin_approval FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

-- ============================================================================
-- UPDATE EXISTING RLS POLICIES TO CHECK ADMIN APPROVAL
-- ============================================================================

-- Profiles policies - Users can view their own profile regardless of approval status
-- (they need to see their profile to know they're not approved)
-- But keep the update policy restricted to approved users
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id AND public.is_user_approved());

-- Notebooks policies - All operations require approval
DROP POLICY IF EXISTS "Users can view their own notebooks" ON public.notebooks;
CREATE POLICY "Users can view their own notebooks"
    ON public.notebooks FOR SELECT
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can create their own notebooks" ON public.notebooks;
CREATE POLICY "Users can create their own notebooks"
    ON public.notebooks FOR INSERT
    WITH CHECK (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can update their own notebooks" ON public.notebooks;
CREATE POLICY "Users can update their own notebooks"
    ON public.notebooks FOR UPDATE
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can delete their own notebooks" ON public.notebooks;
CREATE POLICY "Users can delete their own notebooks"
    ON public.notebooks FOR DELETE
    USING (auth.uid() = user_id AND public.is_user_approved());

-- Sources policies - All operations require approval
DROP POLICY IF EXISTS "Users can view sources from their notebooks" ON public.sources;
CREATE POLICY "Users can view sources from their notebooks"
    ON public.sources FOR SELECT
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = sources.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create sources in their notebooks" ON public.sources;
CREATE POLICY "Users can create sources in their notebooks"
    ON public.sources FOR INSERT
    WITH CHECK (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = sources.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update sources in their notebooks" ON public.sources;
CREATE POLICY "Users can update sources in their notebooks"
    ON public.sources FOR UPDATE
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = sources.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete sources from their notebooks" ON public.sources;
CREATE POLICY "Users can delete sources from their notebooks"
    ON public.sources FOR DELETE
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = sources.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

-- Notes policies - All operations require approval
DROP POLICY IF EXISTS "Users can view notes from their notebooks" ON public.notes;
CREATE POLICY "Users can view notes from their notebooks"
    ON public.notes FOR SELECT
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = notes.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create notes in their notebooks" ON public.notes;
CREATE POLICY "Users can create notes in their notebooks"
    ON public.notes FOR INSERT
    WITH CHECK (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = notes.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update notes in their notebooks" ON public.notes;
CREATE POLICY "Users can update notes in their notebooks"
    ON public.notes FOR UPDATE
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = notes.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete notes from their notebooks" ON public.notes;
CREATE POLICY "Users can delete notes from their notebooks"
    ON public.notes FOR DELETE
    USING (
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 FROM public.notebooks 
            WHERE notebooks.id = notes.notebook_id 
            AND notebooks.user_id = auth.uid()
        )
    );

-- Documents policies - Drop existing policies before updating function
-- (need to drop these first because they depend on the function)
DROP POLICY IF EXISTS "Users can view documents from their notebooks" ON public.documents;
CREATE POLICY "Users can view documents from their notebooks"
    ON public.documents FOR SELECT
    USING (public.is_notebook_owner_for_document(metadata));

DROP POLICY IF EXISTS "Users can create documents in their notebooks" ON public.documents;
CREATE POLICY "Users can create documents in their notebooks"
    ON public.documents FOR INSERT
    WITH CHECK (public.is_notebook_owner_for_document(metadata));

DROP POLICY IF EXISTS "Users can update documents in their notebooks" ON public.documents;
CREATE POLICY "Users can update documents in their notebooks"
    ON public.documents FOR UPDATE
    USING (public.is_notebook_owner_for_document(metadata));

DROP POLICY IF EXISTS "Users can delete documents from their notebooks" ON public.documents;
CREATE POLICY "Users can delete documents from their notebooks"
    ON public.documents FOR DELETE
    USING (public.is_notebook_owner_for_document(metadata));

-- Now update the helper function to include approval check
CREATE OR REPLACE FUNCTION public.is_notebook_owner_for_document(doc_metadata jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 
            FROM public.notebooks 
            WHERE id = (doc_metadata->>'notebook_id')::uuid 
            AND user_id = auth.uid()
        );
$$;

-- Chat histories policies - Drop existing policies before updating function
-- (need to drop these first because they depend on is_notebook_owner function)
DROP POLICY IF EXISTS "Users can view chat histories from their notebooks" ON public.n8n_chat_histories;
DROP POLICY IF EXISTS "Users can create chat histories in their notebooks" ON public.n8n_chat_histories;
DROP POLICY IF EXISTS "Users can delete chat histories from their notebooks" ON public.n8n_chat_histories;

-- Now update the is_notebook_owner function to also check approval
CREATE OR REPLACE FUNCTION public.is_notebook_owner(notebook_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
    SELECT 
        public.is_user_approved() AND
        EXISTS (
            SELECT 1 
            FROM public.notebooks 
            WHERE id = notebook_id_param 
            AND user_id = auth.uid()
        );
$$;

-- Recreate chat histories policies with updated function
CREATE POLICY "Users can view chat histories from their notebooks"
    ON public.n8n_chat_histories FOR SELECT
    USING (public.is_notebook_owner(session_id::uuid));

CREATE POLICY "Users can create chat histories in their notebooks"
    ON public.n8n_chat_histories FOR INSERT
    WITH CHECK (public.is_notebook_owner(session_id::uuid));
CREATE POLICY "Users can delete chat histories from their notebooks"
    ON public.n8n_chat_histories FOR DELETE
    USING (public.is_notebook_owner(session_id::uuid));

-- Storage policies - Update to check approval
DROP POLICY IF EXISTS "Users can view their own source files" ON storage.objects;
CREATE POLICY "Users can view their own source files"
ON storage.objects FOR SELECT
USING (
  public.is_user_approved() AND
  bucket_id = 'sources' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can upload source files to their notebooks" ON storage.objects;
CREATE POLICY "Users can upload source files to their notebooks"
ON storage.objects FOR INSERT
WITH CHECK (
  public.is_user_approved() AND
  bucket_id = 'sources' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update their own source files" ON storage.objects;
CREATE POLICY "Users can update their own source files"
ON storage.objects FOR UPDATE
USING (
  public.is_user_approved() AND
  bucket_id = 'sources' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own source files" ON storage.objects;
CREATE POLICY "Users can delete their own source files"
ON storage.objects FOR DELETE
USING (
  public.is_user_approved() AND
  bucket_id = 'sources' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- MICROCASTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own microcasts" ON public.microcasts;
CREATE POLICY "Users can view their own microcasts"
    ON public.microcasts FOR SELECT
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can create their own microcasts" ON public.microcasts;
CREATE POLICY "Users can create their own microcasts"
    ON public.microcasts FOR INSERT
    WITH CHECK (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can update their own microcasts" ON public.microcasts;
CREATE POLICY "Users can update their own microcasts"
    ON public.microcasts FOR UPDATE
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can delete their own microcasts" ON public.microcasts;
CREATE POLICY "Users can delete their own microcasts"
    ON public.microcasts FOR DELETE
    USING (auth.uid() = user_id AND public.is_user_approved());

-- Microcasts audio storage policies
DROP POLICY IF EXISTS "Users can view their own microcast audio files" ON storage.objects;
CREATE POLICY "Users can view their own microcast audio files"
ON storage.objects FOR SELECT
USING (
  public.is_user_approved() AND
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'microcasts' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM microcasts WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own microcast audio files" ON storage.objects;
CREATE POLICY "Users can delete their own microcast audio files"
ON storage.objects FOR DELETE
USING (
  public.is_user_approved() AND
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'microcasts' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT id FROM microcasts WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- PODCASTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own podcasts" ON public.podcasts;
CREATE POLICY "Users can view their own podcasts"
    ON public.podcasts FOR SELECT
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can create their own podcasts" ON public.podcasts;
CREATE POLICY "Users can create their own podcasts"
    ON public.podcasts FOR INSERT
    WITH CHECK (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can update their own podcasts" ON public.podcasts;
CREATE POLICY "Users can update their own podcasts"
    ON public.podcasts FOR UPDATE
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can delete their own podcasts" ON public.podcasts;
CREATE POLICY "Users can delete their own podcasts"
    ON public.podcasts FOR DELETE
    USING (auth.uid() = user_id AND public.is_user_approved());

-- ============================================================================
-- USER_CATEGORIES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own categories" ON public.user_categories;
CREATE POLICY "Users can view their own categories" 
    ON public.user_categories
    FOR SELECT 
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can insert their own categories" ON public.user_categories;
CREATE POLICY "Users can insert their own categories" 
    ON public.user_categories
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can update their own categories" ON public.user_categories;
CREATE POLICY "Users can update their own categories" 
    ON public.user_categories
    FOR UPDATE 
    USING (auth.uid() = user_id AND public.is_user_approved());

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.user_categories;
CREATE POLICY "Users can delete their own categories" 
    ON public.user_categories
    FOR DELETE 
    USING (auth.uid() = user_id AND public.is_user_approved());

-- ============================================================================
-- AUDIO BUCKET POLICIES (UPDATE WITH APPROVAL CHECK)
-- ============================================================================

-- Update the general audio files viewing policy
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
CREATE POLICY "Users can view their own audio files"
ON storage.objects FOR SELECT
USING (
  public.is_user_approved() AND
  bucket_id = 'audio' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
CREATE POLICY "Users can delete their own audio files"
ON storage.objects FOR DELETE
USING (
  public.is_user_approved() AND
  bucket_id = 'audio' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM notebooks WHERE user_id = auth.uid()
  )
);

COMMIT;

