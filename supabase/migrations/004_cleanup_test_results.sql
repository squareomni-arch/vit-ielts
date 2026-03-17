-- ============================================================================
-- Migration: 004_cleanup_test_results.sql
-- Description: Auto-cleanup infrastructure for old test results
--   - Index on submitted_at for efficient deletion queries
--   - RPC function cleanup_old_test_results() to purge:
--     • Published results older than 6 months (from submitted_at)
--     • Draft results older than 30 days (from created_at)
--   - pg_cron schedule: runs every Sunday at 3 AM UTC
--
-- ⚠️ PREREQUISITE: Enable pg_cron extension in Supabase Dashboard
--    → Database → Extensions → search "pg_cron" → Enable
-- ============================================================================

-- Index for fast date-range queries on test_results
CREATE INDEX IF NOT EXISTS idx_test_results_submitted_at
  ON test_results(submitted_at);

-- ============================================================================
-- CLEANUP OLD TEST RESULTS
-- Deletes published test results older than 6 months
-- and abandoned drafts older than 30 days.
-- Returns the number of deleted rows.
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_old_test_results()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM test_results
    WHERE
      (status = 'published' AND submitted_at < now() - INTERVAL '6 months')
      OR
      (status = 'draft' AND created_at < now() - INTERVAL '30 days')
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- SCHEDULE: Run cleanup every Sunday at 3 AM UTC via pg_cron
-- ============================================================================
SELECT cron.schedule(
  'cleanup-old-test-results',
  '0 3 * * 0',
  $$SELECT cleanup_old_test_results()$$
);
