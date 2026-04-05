    -- ===========================
    -- Media Library — Catalog for uploaded files
    -- ===========================

    CREATE TABLE IF NOT EXISTS public.media_library (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        filename TEXT NOT NULL,
        mimetype TEXT DEFAULT 'image/jpeg',
        size INTEGER DEFAULT 0,
        uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_media_library_filename ON public.media_library(filename);
    CREATE INDEX IF NOT EXISTS idx_media_library_created_at ON public.media_library(created_at DESC);

    -- RLS: Only admins
    ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Admin full access media_library"
        ON public.media_library
        FOR ALL
        USING (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND roles ? 'administrator')
        );
