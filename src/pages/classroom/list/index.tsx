import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import {
  getClassroomsForUser,
  getTeacherDashboardStats,
  getStudentDashboardStats,
} from "~services/classroom";
import { isTeacherRole } from "~lib/parseRoles";
import { ROUTES } from "@/shared/routes";

export { PageClassroomList } from "./ui";

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

  const [master, classrooms, stats, studentStats] = await Promise.all([
    getMasterData(context),
    getClassroomsForUser(supabase, user.id),
    isTeacher ? getTeacherDashboardStats(supabase, user.id) : Promise.resolve(null),
    getStudentDashboardStats(supabase, user.id),
  ]);

  return {
    props: {
      ...master.props,
      isTeacher,
      classrooms,
      stats,
      studentStats,
    },
  };
};
