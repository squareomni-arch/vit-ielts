import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getStudentAssignmentDetail } from "~services/classroom";
import { ROUTES } from "@/shared/routes";

export { PageMyAssignmentDetail } from "./ui";

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

  const assignmentId = context.params?.id as string;
  const [master, assignment] = await Promise.all([
    getMasterData(context),
    getStudentAssignmentDetail(supabase, user.id, assignmentId),
  ]);

  if (!assignment) {
    return { redirect: { destination: ROUTES.CLASSROOM.MY_ASSIGNMENTS, statusCode: 302 } };
  }

  return {
    props: {
      ...master.props,
      assignment,
    },
  };
};
