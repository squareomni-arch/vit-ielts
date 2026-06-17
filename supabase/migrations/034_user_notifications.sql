-- ============================================================================
-- VitIELTS — User Notifications
-- Migration: 034_user_notifications.sql
-- Description:
--   Per-user in-app notifications. Events across the app (order/Pro activation,
--   test scoring, classroom assignments, community replies) create a row here;
--   the notification bell in the app shell reads them.
--   * Distinct from admin_notifications (010) which is admin-only.
--   * INSERT is service_role only (created via supabaseAdmin from event handlers);
--     users may only SELECT/UPDATE their own rows (mark-as-read).
--   All changes are additive / idempotent — safe to run on an existing DB.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT,
  type        TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category    TEXT,          -- 'order' | 'test' | 'classroom' | 'community'
  entity_id   TEXT,
  link        TEXT,          -- internal route to navigate to on click
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users may read only their own notifications.
DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users may update only their own notifications (mark-as-read).
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No INSERT grant: rows are created only via supabaseAdmin (service_role).
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
