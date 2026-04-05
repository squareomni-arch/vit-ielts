-- ===========================
-- Activity Log — Audit trail cho admin actions
-- ===========================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL,          -- 'create', 'update', 'delete', 'login', 'publish', 'unpublish'
    entity_type TEXT NOT NULL,     -- 'quiz', 'post', 'user', 'order', 'cms_config', 'sample_essay', 'coupon'
    entity_id TEXT,
    entity_title TEXT,
    metadata JSONB DEFAULT '{}',   -- Extra context (old values, new values, etc.)
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- RLS: Only admins can read/write
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read activity logs"
    ON public.activity_logs
    FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND roles ? 'administrator')
    );

CREATE POLICY "Admin insert activity logs"
    ON public.activity_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND roles ? 'administrator')
    );

-- Also allow service_role (supabaseAdmin) to insert without auth context
-- This is handled automatically by service_role key bypassing RLS

-- ===========================
-- Admin Notifications — In-app notification system
-- ===========================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    entity_type TEXT,              -- 'order', 'user', 'quiz', etc.
    entity_id TEXT,
    link TEXT,                     -- Admin page link (e.g. "/admin/orders/123")
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- RLS: Only admins
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access notifications"
    ON public.admin_notifications
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND roles ? 'administrator')
    );

-- ===========================
-- SEO Redirects — URL redirect rules
-- ===========================

CREATE TABLE IF NOT EXISTS public.redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_path TEXT UNIQUE NOT NULL,
    target_path TEXT NOT NULL,
    status_code INTEGER DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
    is_active BOOLEAN DEFAULT true,
    hits INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redirects_source ON public.redirects(source_path) WHERE is_active = true;

-- RLS: Public read (for middleware), admin write
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active redirects"
    ON public.redirects
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin full access redirects"
    ON public.redirects
    FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND roles ? 'administrator')
    );
