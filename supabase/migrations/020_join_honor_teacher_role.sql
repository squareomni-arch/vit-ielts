-- ============================================================================
-- Classroom — honor the requested role on self-join (teacher invite link)
-- Migration: 020_join_honor_teacher_role.sql
--
-- Previously join_classroom_by_code downgraded a teacher-link join to 'student'
-- unless the caller held the GLOBAL teacher role, so a co-teacher invited by
-- link was recorded as a student. Now the requested role is kept as-is, but the
-- join is always PENDING — the class owner approves it in "Yêu cầu vào lớp",
-- which is what gates teacher access (the invite link alone is not enough).
--
-- Returns { id, name, status, role } so the UI can message accordingly.
-- ============================================================================

CREATE OR REPLACE FUNCTION join_classroom_by_code(p_code TEXT, p_role TEXT DEFAULT 'student')
RETURNS JSONB AS $$
DECLARE
  v_class    classrooms;
  v_uid      UUID := auth.uid();
  v_role     TEXT;
  v_status   TEXT;
  v_existing classroom_members;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO v_class
  FROM classrooms
  WHERE invite_code = upper(trim(p_code)) AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CLASS_NOT_FOUND';
  END IF;

  v_role := lower(coalesce(p_role, 'student'));
  IF v_role NOT IN ('teacher', 'student') THEN
    v_role := 'student';
  END IF;

  -- All self-joins await the owner's approval (this is the real gate).
  v_status := 'pending';

  SELECT * INTO v_existing
  FROM classroom_members
  WHERE classroom_id = v_class.id AND user_id = v_uid;

  IF FOUND THEN
    -- Keep an existing membership untouched (don't reset an approved member).
    v_role   := v_existing.role;
    v_status := v_existing.status;
  ELSE
    INSERT INTO classroom_members (classroom_id, user_id, role, status)
    VALUES (v_class.id, v_uid, v_role, v_status);
  END IF;

  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'status', v_status,
    'role', v_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
