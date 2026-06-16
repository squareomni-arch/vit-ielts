-- ============================================================================
-- Vit IELTS — Vocabulary SRS (Spaced-Repetition Scheduling)
-- Migration: 030_vocab_srs.sql
-- Description:
--   Extends user_vocab with SM-2-lite scheduling columns so the app can
--   surface words that are due for review.  All columns are additive and
--   default-safe so existing rows continue to work without a data backfill.
-- ============================================================================

-- SM-2-lite scheduling columns
ALTER TABLE public.user_vocab
  ADD COLUMN IF NOT EXISTS interval_days INT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ease          NUMERIC   NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;

-- Speed up "due words" queries (next_review_at <= now())
CREATE INDEX IF NOT EXISTS idx_user_vocab_next_review
  ON public.user_vocab (user_id, next_review_at);
