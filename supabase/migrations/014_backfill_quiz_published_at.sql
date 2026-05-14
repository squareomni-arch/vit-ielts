-- ============================================================================
-- Migration: 014_backfill_quiz_published_at.sql
-- Description: Backfill `published_at` for quizzes that are status='published'
-- but never had the column set. The listing "Newest" sort orders by
-- published_at DESC, so a NULL value pushes the quiz to the bottom (or top,
-- depending on NULLS FIRST/LAST) regardless of when it actually went live.
--
-- Going forward, updateQuiz() in services/quiz.ts stamps published_at when a
-- quiz transitions to status='published' for the first time. This migration
-- handles the historical rows that pre-date that fix.
-- ============================================================================

UPDATE quizzes
SET published_at = COALESCE(published_at, updated_at, created_at)
WHERE status = 'published'
  AND published_at IS NULL;
