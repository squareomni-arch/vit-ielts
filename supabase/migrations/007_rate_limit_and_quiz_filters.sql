-- ============================================================================
-- Migration: 007_rate_limit_and_quiz_filters.sql
-- Description:
--   1. rate_limits table + check_rate_limit RPC (Suggestion #5)
--   2. get_quiz_filter_options RPC (Suggestion #8)
-- ============================================================================

-- ============================================================================
-- 1. RATE LIMITING (Suggestion #5)
-- Replaces in-memory Map with a persistent table for serverless environments.
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits (reset_at);

-- Atomically check and increment rate limit.
-- Returns: allowed (boolean), current_count, retry_after_sec
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_ms INTEGER
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, retry_after_sec INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_window INTERVAL := (p_window_ms || ' milliseconds')::INTERVAL;
  v_reset_at TIMESTAMPTZ := v_now + v_window;
  v_entry RECORD;
BEGIN
  -- Try to get existing entry with row lock
  SELECT rl.count, rl.reset_at INTO v_entry
  FROM rate_limits rl
  WHERE rl.key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    -- New entry: insert and allow
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (p_key, 1, v_reset_at);
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  IF v_now > v_entry.reset_at THEN
    -- Window expired: reset
    UPDATE rate_limits SET count = 1, reset_at = v_reset_at WHERE rate_limits.key = p_key;
    RETURN QUERY SELECT true, 1, 0;
    RETURN;
  END IF;

  -- Increment
  UPDATE rate_limits SET count = rate_limits.count + 1 WHERE rate_limits.key = p_key;

  IF v_entry.count + 1 > p_max THEN
    -- Rate limited
    RETURN QUERY SELECT false, v_entry.count + 1,
      GREATEST(0, EXTRACT(EPOCH FROM v_entry.reset_at - v_now)::INTEGER);
    RETURN;
  END IF;

  -- Allowed
  RETURN QUERY SELECT true, v_entry.count + 1, 0;
END;
$$;

-- Periodic cleanup function (call via pg_cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE reset_at < NOW();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


-- ============================================================================
-- 2. QUIZ FILTER OPTIONS (Suggestion #8)
-- Replaces full-table scan for DISTINCT values.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_quiz_filter_options()
RETURNS TABLE(
  years TEXT[],
  sources TEXT[],
  parts TEXT[],
  quarters TEXT[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ARRAY(SELECT DISTINCT q.year FROM quizzes q WHERE q.status = 'published' AND q.year IS NOT NULL ORDER BY q.year),
    ARRAY(SELECT DISTINCT q.source FROM quizzes q WHERE q.status = 'published' AND q.source IS NOT NULL ORDER BY q.source),
    ARRAY(SELECT DISTINCT q.part FROM quizzes q WHERE q.status = 'published' AND q.part IS NOT NULL ORDER BY q.part),
    ARRAY(SELECT DISTINCT q.quarter FROM quizzes q WHERE q.status = 'published' AND q.quarter IS NOT NULL ORDER BY q.quarter);
END;
$$;
