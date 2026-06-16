-- ============================================================================
-- Vit IELTS — Study Plan feature
-- Migration: 027_study_plan.sql
-- Description:
--   Per-user daily study tasks that power the Study Plan page.
--   Users own their own rows (RLS: user_id = auth.uid()).
--   Task creation / generation is handled by separate future features.
-- ============================================================================

-- ===========================
-- TABLE
-- ===========================

CREATE TABLE IF NOT EXISTS public.study_tasks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date   DATE        NOT NULL,
  title      TEXT        NOT NULL,
  skill      TEXT,
  done       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================
-- INDEXES
-- ===========================

CREATE INDEX IF NOT EXISTS idx_study_tasks_user_date ON study_tasks (user_id, due_date);

-- ===========================
-- ROW LEVEL SECURITY
-- ===========================

ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User own study tasks"
  ON study_tasks FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ===========================
-- GRANTS
-- ===========================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_tasks TO authenticated;
