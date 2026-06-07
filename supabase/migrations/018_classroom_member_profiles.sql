-- ============================================================================
-- Classroom — let class members read co-members' basic profile
-- Migration: 018_classroom_member_profiles.sql
--
-- The base users RLS only allows reading your OWN row (auth.uid() = id), so a
-- teacher can't see students' name/email (member list shows a blank "?" avatar).
-- This policy lets a user read the profile of anyone who shares a classroom
-- with them.
--
-- NOTE: RLS is row-level, so this grants read access to the whole users row for
-- co-members (incl. phone_number, date_of_birth). The app only selects
-- name/email/avatar_url. If stricter privacy is needed, replace this with a
-- SECURITY DEFINER RPC that returns only the safe columns.
-- ============================================================================

CREATE OR REPLACE FUNCTION shares_classroom(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members x
    JOIN classroom_members y ON y.classroom_id = x.classroom_id
    WHERE x.user_id = p_user_a AND y.user_id = p_user_b
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Members read co-member profiles"
  ON users FOR SELECT
  USING (shares_classroom(id, auth.uid()));
