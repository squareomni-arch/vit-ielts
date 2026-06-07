import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getClassroom, getAssignmentDetail } from "~services/classroom";
import { ROUTES } from "@/shared/routes";

export { PageAssignmentDetail } from "./ui";

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
  const assignmentId = context.params?.aid as string;

  const [master, result, detail] = await Promise.all([
    getMasterData(context),
    getClassroom(supabase, classroomId),
    getAssignmentDetail(supabase, assignmentId),
  ]);

  if (!result) {
    return { redirect: { destination: ROUTES.CLASSROOM.LIST, statusCode: 302 } };
  }
  const viewer = result.members.find((m) => m.user_id === user.id);
  if (!viewer || viewer.role !== "teacher") {
    return { redirect: { destination: ROUTES.CLASSROOM.DETAIL(classroomId), statusCode: 302 } };
  }
  if (!detail) {
    return {
      redirect: {
        destination: `${ROUTES.CLASSROOM.DETAIL(classroomId)}?tab=assignments`,
        statusCode: 302,
      },
    };
  }

  return {
    props: {
      ...master.props,
      detail,
    },
  };
};
