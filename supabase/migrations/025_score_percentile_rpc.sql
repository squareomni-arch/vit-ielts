-- Migration: 025_score_percentile_rpc.sql
-- Percentile of a score among finished results for a quiz, computed server-side
-- via SECURITY DEFINER so it works under the per-user RLS on test_results
-- ("User own test results") WITHOUT exposing other users' rows — it returns
-- only aggregate numbers.

CREATE OR REPLACE FUNCTION get_score_percentile(
  p_quiz_id uuid,
  p_score numeric,
  p_exclude_result uuid
)
RETURNS TABLE(percentile int, sample_size int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH others AS (
    SELECT score
    FROM test_results
    WHERE quiz_id = p_quiz_id
      AND status = 'published'
      AND score IS NOT NULL
      AND id <> p_exclude_result
  )
  SELECT
    CASE WHEN COUNT(*) = 0 THEN NULL
         ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE p_score > score) / COUNT(*))::int
    END AS percentile,
    COUNT(*)::int AS sample_size
  FROM others;
$$;

GRANT EXECUTE ON FUNCTION get_score_percentile(uuid, numeric, uuid) TO authenticated, anon;
