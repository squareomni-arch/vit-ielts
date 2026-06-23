-- ============================================================================
-- VitIELTS — Landing Leads
-- Migration: 035_landing_leads.sql
-- Description:
--   Captures the marketing landing-page lead form (name + phone + target band).
--   Rows are created ONLY via supabaseAdmin (service_role) from
--   /api/leads/create; the admin CMS reads/manages them via /api/admin/leads.
--   RLS is enabled with no anon/authenticated policies — the table is closed to
--   the public; service_role bypasses RLS for the API routes.
--   All changes are additive / idempotent — safe to run on an existing DB.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.landing_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  target_band TEXT,
  source      TEXT NOT NULL DEFAULT 'landing',
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'spam')),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landing_leads_status_created_idx
  ON public.landing_leads (status, created_at DESC);

ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated grants or policies: the table is service_role-only.
