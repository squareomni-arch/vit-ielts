import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { isTeacherRole } from "~lib/parseRoles";
import { ROUTES } from "@/shared/routes";

/**
 * SSR guard for teacher-only pages (dashboard, class management, assignments,
 * tracking). Teachers are *regular* users (admin-granted global `teacher`
 * role), so this uses the normal session client — NOT the admin cookie.
 *
 * Usage:
 *   export const getServerSideProps = withTeacher;
 *
 * Or compose with extra logic:
 *   export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *     const guard = await withTeacher(ctx);
 *     if ("redirect" in guard) return guard;
 *     // ... extra logic
 *   };
 */
export const withTeacher: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabase(context);
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

  const { data: profile } = await supabase
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();

  if (!isTeacherRole(profile?.roles)) {
    return { redirect: { destination: ROUTES.HOME, statusCode: 302 } };
  }

  return { props: {} };
};

/**
 * withTeacher + data pre-fetching in the same SSR request. The callback
 * receives the resolved user id so it can scope queries to the teacher.
 */
export function withTeacherData(
  fetchData: (
    context: GetServerSidePropsContext,
    userId: string
  ) => Promise<Record<string, unknown>>
): GetServerSideProps {
  return async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: { destination: ROUTES.LOGIN(context.resolvedUrl), statusCode: 302 },
      };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("roles")
      .eq("id", user.id)
      .maybeSingle();

    if (!isTeacherRole(profile?.roles)) {
      return { redirect: { destination: ROUTES.HOME, statusCode: 302 } };
    }

    try {
      const extraProps = await fetchData(context, user.id);
      return { props: { ...extraProps } };
    } catch (error) {
      console.error("[withTeacherData] Error fetching data:", error);
      return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
    }
  };
}

/**
 * SSR guard for a single class. Any class member (teacher or student) may view;
 * non-members are bounced. Returns the viewer's per-class role + user id so the
 * page can branch teacher vs student affordances. The `id` is read from
 * `context.params.id`.
 *
 * Usage:
 *   export const getServerSideProps = withClassroomAccess(
 *     async (ctx, { userId, role }) => ({ ...props })
 *   );
 */
export function withClassroomAccess(
  fetchData: (
    context: GetServerSidePropsContext,
    membership: { userId: string; role: "teacher" | "student"; classroomId: string }
  ) => Promise<Record<string, unknown>>
): GetServerSideProps {
  return async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: { destination: ROUTES.LOGIN(context.resolvedUrl), statusCode: 302 },
      };
    }

    const classroomId = context.params?.id as string;
    const { data: membership } = await supabase
      .from("classroom_members")
      .select("role")
      .eq("classroom_id", classroomId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
    }

    try {
      const extraProps = await fetchData(context, {
        userId: user.id,
        role: membership.role as "teacher" | "student",
        classroomId,
      });
      return { props: { ...extraProps } };
    } catch (error) {
      console.error("[withClassroomAccess] Error fetching data:", error);
      return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
    }
  };
}
