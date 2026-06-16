-- ============================================================================
-- Vit IELTS — Study Streak Analytics
-- Migration: 009_study_streak.sql
-- Description: RPC functions for streak calculation & monthly activity data.
--              Operates directly on test_results + quizzes (no new tables).
-- ============================================================================

-- ===========================
-- 1. RPC: Get Streak Summary
-- ===========================
-- Calculates current streak, longest streak, total active days, this-month days
-- by querying published test_results grouped by submitted_at date.

CREATE OR REPLACE FUNCTION get_study_streak_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_total_days INTEGER := 0;
  v_month_days INTEGER := 0;
  v_streak INTEGER := 0;
  v_prev_date DATE;
  v_rec RECORD;
BEGIN
  -- Total unique active days
  SELECT COUNT(DISTINCT submitted_at::date) INTO v_total_days
  FROM test_results
  WHERE user_id = p_user_id
    AND status = 'published'
    AND submitted_at IS NOT NULL;

  -- Active days this month
  SELECT COUNT(DISTINCT submitted_at::date) INTO v_month_days
  FROM test_results
  WHERE user_id = p_user_id
    AND status = 'published'
    AND submitted_at IS NOT NULL
    AND submitted_at::date >= date_trunc('month', CURRENT_DATE)::date
    AND submitted_at::date <= CURRENT_DATE;

  -- Calculate streaks by iterating distinct dates in order
  v_prev_date := NULL;
  v_streak := 0;

  FOR v_rec IN
    SELECT DISTINCT submitted_at::date AS activity_date
    FROM test_results
    WHERE user_id = p_user_id
      AND status = 'published'
      AND submitted_at IS NOT NULL
    ORDER BY activity_date ASC
  LOOP
    IF v_prev_date IS NULL OR v_rec.activity_date = v_prev_date + 1 THEN
      v_streak := v_streak + 1;
    ELSE
      v_streak := 1;
    END IF;

    IF v_streak > v_longest_streak THEN
      v_longest_streak := v_streak;
    END IF;

    v_prev_date := v_rec.activity_date;
  END LOOP;

  -- Current streak: active if last activity was today or yesterday
  IF v_prev_date IS NOT NULL AND (v_prev_date = CURRENT_DATE OR v_prev_date = CURRENT_DATE - 1) THEN
    v_current_streak := v_streak;
  ELSE
    v_current_streak := 0;
  END IF;

  RETURN json_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'total_days', v_total_days,
    'month_days', v_month_days
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ===========================
-- 2. RPC: Get Monthly Activity Data
-- ===========================
-- Returns daily skill breakdown (reading/listening) for a given month.

CREATE OR REPLACE FUNCTION get_monthly_activities(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;

  RETURN (
    SELECT COALESCE(json_agg(row_data), '[]'::json)
    FROM (
      SELECT
        tr.submitted_at::date::text AS date,
        COUNT(*) FILTER (WHERE q.skill = 'reading') AS reading,
        COUNT(*) FILTER (WHERE q.skill = 'listening') AS listening,
        COUNT(*) AS total
      FROM test_results tr
      JOIN quizzes q ON q.id = tr.quiz_id
      WHERE tr.user_id = p_user_id
        AND tr.status = 'published'
        AND tr.submitted_at IS NOT NULL
        AND tr.submitted_at::date >= v_start_date
        AND tr.submitted_at::date <= v_end_date
      GROUP BY tr.submitted_at::date
      ORDER BY tr.submitted_at::date ASC
    ) AS row_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
