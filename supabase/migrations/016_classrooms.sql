-- ============================================================================
-- IELTS Prediction — Classroom (Lớp học) feature
-- Migration: 016_classrooms.sql
-- Description:
--   Teachers create classes, invite students/co-teachers by code/link, assign
--   practice/exam quizzes (đề) with deadlines. Submission status & scores are
--   DERIVED from the existing `test_results` table (no submissions table).
--   The global `teacher` role lives in users.roles (admin-granted).
-- ============================================================================

-- ===========================
-- TABLES
-- ===========================

-- Classes
CREATE TABLE public.classrooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,                          -- 6-char A–Z0–9, e.g. ABCXYZ
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Members (per-class role; the owner is also a 'teacher' member row)
CREATE TABLE public.classroom_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  joined_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (classroom_id, user_id)
);

-- Assignments (one row per quiz; the 2-step "Giao bài" modal creates N rows at once)
CREATE TABLE public.classroom_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id    UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  quiz_id         UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  due_at          TIMESTAMPTZ,                               -- nullable ("Hạn nộp (tùy chọn)")
  note            TEXT,                                      -- "Lời dặn của giáo viên"
  assigned_to_all BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Specific-student targets (only populated when assigned_to_all = false)
CREATE TABLE public.classroom_assignment_targets (
  assignment_id UUID NOT NULL REFERENCES classroom_assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, student_id)
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX idx_classrooms_owner ON classrooms(owner_id);
CREATE INDEX idx_classroom_members_classroom ON classroom_members(classroom_id);
CREATE INDEX idx_classroom_members_user ON classroom_members(user_id);
CREATE INDEX idx_classroom_assignments_classroom ON classroom_assignments(classroom_id);
CREATE INDEX idx_classroom_assignments_quiz ON classroom_assignments(quiz_id);
CREATE INDEX idx_classroom_assignment_targets_student ON classroom_assignment_targets(student_id);

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — bypass RLS to avoid recursive policies)
-- ============================================================================

-- Generate a unique 6-char invite code
CREATE OR REPLACE FUNCTION generate_classroom_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code  TEXT;
  i     INT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * 36)::int + 1, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM classrooms WHERE invite_code = code);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-fill invite_code on insert when not provided (regenerate by passing NULL)
CREATE OR REPLACE FUNCTION set_classroom_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_classroom_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classroom_invite_code
  BEFORE INSERT ON classrooms
  FOR EACH ROW EXECUTE FUNCTION set_classroom_invite_code();

-- Membership predicates (definer-owned → safe to call from RLS policies)
CREATE OR REPLACE FUNCTION is_classroom_member(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_classroom_teacher(p_classroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_members
    WHERE classroom_id = p_classroom_id AND user_id = p_user_id AND role = 'teacher'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- True when p_teacher teaches a class that p_student is a student in
-- (used so teachers can read their students' test_results for tracking)
CREATE OR REPLACE FUNCTION shares_classroom_as_teacher(p_student UUID, p_teacher UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classroom_members t
    JOIN classroom_members s ON s.classroom_id = t.classroom_id
    WHERE t.user_id = p_teacher AND t.role = 'teacher'
      AND s.user_id = p_student AND s.role = 'student'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Join a class by invite code (non-members can't SELECT the class under RLS, so
-- this definer-owned RPC does the lookup + membership insert). A teacher join is
-- only honored when the caller holds the global teacher role; otherwise student.
CREATE OR REPLACE FUNCTION join_classroom_by_code(p_code TEXT, p_role TEXT DEFAULT 'student')
RETURNS classrooms AS $$
DECLARE
  v_class      classrooms;
  v_uid        UUID := auth.uid();
  v_role       TEXT;
  v_is_teacher BOOLEAN;
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

  INSERT INTO classroom_members (classroom_id, user_id, role)
  VALUES (v_class.id, v_uid, v_role)
  ON CONFLICT (classroom_id, user_id) DO NOTHING;

  RETURN v_class;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teacher adds a member by email (teachers can't read users by email under RLS).
CREATE OR REPLACE FUNCTION add_classroom_member_by_email(
  p_classroom_id UUID, p_email TEXT, p_role TEXT
)
RETURNS classroom_members AS $$
DECLARE
  v_member  classroom_members;
  v_user_id UUID;
BEGIN
  IF NOT is_classroom_teacher(p_classroom_id, auth.uid()) THEN
    RAISE EXCEPTION 'NOT_TEACHER';
  END IF;
  IF p_role NOT IN ('teacher', 'student') THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END IF;

  SELECT id INTO v_user_id FROM users WHERE lower(email) = lower(trim(p_email));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  INSERT INTO classroom_members (classroom_id, user_id, role)
  VALUES (p_classroom_id, v_user_id, p_role)
  ON CONFLICT (classroom_id, user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- -----------------------------------------------
-- CLASSROOMS
-- -----------------------------------------------
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their classrooms"
  ON classrooms FOR SELECT
  USING (
    owner_id = auth.uid()
    OR is_classroom_member(id, auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

CREATE POLICY "Teachers create classrooms"
  ON classrooms FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND (roles ? 'teacher' OR roles ? 'administrator')
    )
  );

CREATE POLICY "Class teachers update classroom"
  ON classrooms FOR UPDATE
  USING (is_classroom_teacher(id, auth.uid()) OR owner_id = auth.uid());

CREATE POLICY "Owner deletes classroom"
  ON classrooms FOR DELETE
  USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- -----------------------------------------------
-- CLASSROOM MEMBERS
-- -----------------------------------------------
ALTER TABLE classroom_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read co-members"
  ON classroom_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_classroom_member(classroom_id, auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

-- Teacher adds members, owner seeds first member, or a user self-joins by code
CREATE POLICY "Add members"
  ON classroom_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR is_classroom_teacher(classroom_id, auth.uid())
    OR EXISTS (SELECT 1 FROM classrooms WHERE id = classroom_id AND owner_id = auth.uid())
  );

CREATE POLICY "Teacher updates member roles"
  ON classroom_members FOR UPDATE
  USING (is_classroom_teacher(classroom_id, auth.uid()));

-- Teacher removes members, or a member leaves the class themselves
CREATE POLICY "Remove members"
  ON classroom_members FOR DELETE
  USING (user_id = auth.uid() OR is_classroom_teacher(classroom_id, auth.uid()));

-- -----------------------------------------------
-- CLASSROOM ASSIGNMENTS
-- -----------------------------------------------
ALTER TABLE classroom_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read assignments"
  ON classroom_assignments FOR SELECT
  USING (
    is_classroom_member(classroom_id, auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND roles ? 'administrator')
  );

CREATE POLICY "Teachers manage assignments"
  ON classroom_assignments FOR ALL
  USING (is_classroom_teacher(classroom_id, auth.uid()))
  WITH CHECK (is_classroom_teacher(classroom_id, auth.uid()));

-- -----------------------------------------------
-- CLASSROOM ASSIGNMENT TARGETS
-- -----------------------------------------------
ALTER TABLE classroom_assignment_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read assignment targets"
  ON classroom_assignment_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_assignments a
      WHERE a.id = assignment_id AND is_classroom_member(a.classroom_id, auth.uid())
    )
  );

CREATE POLICY "Teachers manage assignment targets"
  ON classroom_assignment_targets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classroom_assignments a
      WHERE a.id = assignment_id AND is_classroom_teacher(a.classroom_id, auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classroom_assignments a
      WHERE a.id = assignment_id AND is_classroom_teacher(a.classroom_id, auth.uid())
    )
  );

-- -----------------------------------------------
-- TEST RESULTS — let teachers read their students' results (for tracking)
-- (extends the existing own-results / admin-read policies from 001)
-- -----------------------------------------------
CREATE POLICY "Teachers read student results in their classes"
  ON test_results FOR SELECT
  USING (shares_classroom_as_teacher(test_results.user_id, auth.uid()));
