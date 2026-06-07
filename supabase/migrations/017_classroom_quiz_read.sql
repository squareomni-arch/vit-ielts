-- ============================================================================
-- Classroom — let class members read quizzes assigned in their classes
-- Migration: 017_classroom_quiz_read.sql
--
-- The base quizzes RLS only allows reading `status = 'published'` quizzes.
-- When a teacher assigns a quiz that is later set to draft (or assigns a draft),
-- the assignment row shows a blank title because the embed is RLS-blocked.
-- This policy lets any member of a class read quizzes that have been assigned in
-- that class, regardless of publish status.
-- ============================================================================

-- SECURITY DEFINER predicate (avoids recursive RLS on the joined tables)
CREATE OR REPLACE FUNCTION is_quiz_assigned_to_member(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_assignments a
    JOIN classroom_members m ON m.classroom_id = a.classroom_id
    WHERE a.quiz_id = p_quiz_id AND m.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Members read assigned quizzes"
  ON quizzes FOR SELECT
  USING (is_quiz_assigned_to_member(id, auth.uid()));
