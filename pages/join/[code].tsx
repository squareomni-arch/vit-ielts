import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { joinClassroomByCode } from "~services/classroom";
import { ROUTES } from "@/shared/routes";
import type { ClassroomRole } from "~services/types/classroom";

/**
 * Invite-link handler: /join/<code>?role=student|teacher
 * Requires login (bounces through the login page and back), then joins the
 * class via the SECURITY DEFINER RPC and redirects into the class.
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerSupabase(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: { destination: ROUTES.LOGIN(context.resolvedUrl), statusCode: 302 },
    };
  }

  const code = String(context.params?.code ?? "");
  const roleParam = context.query.role;
  const role: ClassroomRole = roleParam === "teacher" ? "teacher" : "student";

  try {
    const result = await joinClassroomByCode(supabase, code, role);
    // Students await teacher approval → send them to the list with a notice.
    if (result.status === "pending") {
      return {
        redirect: { destination: `${ROUTES.CLASSROOM.LIST}?join_pending=1`, statusCode: 302 },
      };
    }
    return {
      redirect: { destination: ROUTES.CLASSROOM.DETAIL(result.id), statusCode: 302 },
    };
  } catch {
    return {
      redirect: { destination: `${ROUTES.CLASSROOM.LIST}?join_error=1`, statusCode: 302 },
    };
  }
};

// Never rendered — getServerSideProps always redirects.
export default function JoinClassroom() {
  return null;
}
