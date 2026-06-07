import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getClassroom, getClassroomAssignments } from "~services/classroom";
import { ROUTES } from "@/shared/routes";

export { PageClassroomDetail } from "./ui";

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

  const classroomId = context.params?.id as string;
  const [master, result] = await Promise.all([
    getMasterData(context),
    getClassroom(supabase, classroomId),
  ]);

  if (!result) {
    return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
  }

  const viewer = result.members.find((m) => m.user_id === user.id);
  if (!viewer) {
    return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
  }

  // Teachers also get the assignment list (shown in the "Bài giao" tab)
  const assignments =
    viewer.role === "teacher"
      ? await getClassroomAssignments(supabase, classroomId)
      : [];

  return {
    props: {
      ...master.props,
      classroom: result.classroom,
      members: result.members,
      assignments,
      viewerRole: viewer.role,
      isOwner: result.classroom.owner_id === user.id,
    },
  };
};
