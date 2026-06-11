import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import {
  getClassroomsForUser,
  getClassroomAssignments,
  getAssignmentDetail,
} from "~services/classroom";
import { isTeacherRole } from "~lib/parseRoles";
import { ROUTES } from "@/shared/routes";
import type { PageClassroomStudentsProps } from "./ui";

export { PageClassroomStudents } from "./ui";

export const getServerSideProps: GetServerSideProps<PageClassroomStudentsProps> = async (
  context
) => {
  const supabase = createServerSupabase(context);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: ROUTES.LOGIN(context.resolvedUrl),
        statusCode: 302,
      },
    };
  }

  // ── Teacher-role guard ─────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();

  const isTeacher = isTeacherRole(profile?.roles);

  if (!isTeacher) {
    return {
      redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 },
    };
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const [master, classrooms] = await Promise.all([
    getMasterData(context),
    getClassroomsForUser(supabase, user.id),
  ]);

  // Pick the teacher's own classes (where viewer_role === "teacher"),
  // preferring the most recently created one.
  const teacherClasses = classrooms
    .filter((c) => c.viewer_role === "teacher")
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const activeClass = teacherClasses[0] ?? null;

  if (!activeClass) {
    // Teacher exists but has no classes yet — show empty state.
    return {
      props: {
        ...master.props,
        classroomName: "",
        detail: null,
        assignments: [],
      },
    };
  }

  // Load all assignments for this class, then pull the latest one's detail.
  const assignments = await getClassroomAssignments(supabase, activeClass.id);
  const latestAssignment = assignments[0] ?? null; // getClassroomAssignments returns desc by created_at

  let detail = null;
  if (latestAssignment) {
    detail = await getAssignmentDetail(supabase, latestAssignment.id);
  }

  return {
    props: {
      ...master.props,
      classroomName: activeClass.name,
      detail,
      assignments,
    },
  };
};
