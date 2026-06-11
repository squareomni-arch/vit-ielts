import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import {
  getClassroomsForUser,
  getTeacherDashboardStats,
} from "~services/classroom";
import { isTeacherRole } from "~lib/parseRoles";
import { ROUTES } from "@/shared/routes";

export { PageClassroomOverview } from "./ui";

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

  const { data: profile } = await supabase
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();

  const isTeacher = isTeacherRole(profile?.roles);

  // Non-teachers are redirected to the classroom list
  if (!isTeacher) {
    return {
      redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 },
    };
  }

  const [master, classrooms, stats] = await Promise.all([
    getMasterData(context),
    getClassroomsForUser(supabase, user.id),
    getTeacherDashboardStats(supabase, user.id),
  ]);

  return {
    props: {
      ...master.props,
      classrooms,
      stats,
    },
  };
};
