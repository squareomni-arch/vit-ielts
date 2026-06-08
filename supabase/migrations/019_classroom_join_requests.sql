-- ============================================================================
-- Classroom — student join requests (teacher approval)
-- Migration: 019_classroom_join_requests.sql
--
-- Students who self-join by code/link are inserted as PENDING and gain no class
-- access until a teacher approves them. Teachers and members added by a teacher
-- (add_classroom_member_by_email) are ACTIVE immediately.
--
-- Membership predicates now require status = 'active', so a pending row grants
-- no access to assignments, quizzes, co-member profiles, or tracking.
-- ============================================================================

ALTER TABLE classroom_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active'));

-- -----------------------------------------------------------------------------
-- Membership predicates → require ACTIVE
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_classroom_member(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_classroom_teacher(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id
      AND role = 'teacher' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Teacher reads their (active) students' results for tracking
CREATE OR REPLACE FUNCTION shares_classroom_as_teacher(p_student UUID, p_teacher UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members t
    JOIN classroom_members s ON s.classroom_id = t.classroom_id
    WHERE t.user_id = p_teacher AND t.role = 'teacher' AND t.status = 'active'
      AND s.user_id = p_student AND s.role = 'student' AND s.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Assigned-quiz read access → only ACTIVE members (migration 017)
CREATE OR REPLACE FUNCTION is_quiz_assigned_to_member(p_quiz_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_assignments a
    JOIN classroom_members m ON m.classroom_id = a.classroom_id
    WHERE a.quiz_id = p_quiz_id AND m.user_id = p_user_id AND m.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Co-member profile reads (migration 018): the READER must be active; the target
-- may be pending so a teacher can see a pending student's name/email in the
-- "Yêu cầu vào lớp" list.
CREATE OR REPLACE FUNCTION shares_classroom(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members x
    JOIN classroom_members y ON y.classroom_id = x.classroom_id
    WHERE x.user_id = p_user_a
      AND y.user_id = p_user_b AND y.status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- -----------------------------------------------------------------------------
-- Join by code → students PENDING, teachers ACTIVE. Returns the class + the
-- resulting membership status so the UI can show "request sent" vs "joined".
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS join_classroom_by_code(TEXT, TEXT);

CREATE FUNCTION join_classroom_by_code(p_code TEXT, p_role TEXT DEFAULT 'student')
RETURNS JSONB AS $$
DECLARE
  v_class      classrooms;
  v_uid        UUID := auth.uid();
  v_role       TEXT;
  v_is_teacher BOOLEAN;
  v_status     TEXT;
  v_existing   TEXT;
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
  IF v_role = 'teacher' THEN
    SELECT (roles ? 'teacher' OR roles ? 'administrator')
      INTO v_is_teacher FROM users WHERE id = v_uid;
    IF NOT coalesce(v_is_teacher, false) THEN
      v_role := 'student';
    END IF;
  ELSE
    v_role := 'student';
  END IF;

  -- Teachers join instantly; students await approval.
  v_status := CASE WHEN v_role = 'teacher' THEN 'active' ELSE 'pending' END;

  -- Keep an existing membership's status (don't downgrade an approved student).
  SELECT status INTO v_existing
  FROM classroom_members
  WHERE classroom_id = v_class.id AND user_id = v_uid;

  IF v_existing IS NOT NULL THEN
    v_status := v_existing;
  ELSE
    INSERT INTO classroom_members (classroom_id, user_id, role, status)
    VALUES (v_class.id, v_uid, v_role, v_status);
  END IF;

  RETURN jsonb_build_object(
    'id', v_class.id,
    'name', v_class.name,
    'status', v_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
