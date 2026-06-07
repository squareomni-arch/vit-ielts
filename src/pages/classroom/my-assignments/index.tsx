import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getStudentAssignments } from "~services/classroom";
import { ROUTES } from "@/shared/routes";

export { PageMyAssignments } from "./ui";

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

  const [master, assignments] = await Promise.all([
    getMasterData(context),
    getStudentAssignments(supabase, user.id),
  ]);

  return {
    props: {
      ...master.props,
      assignments,
    },
  };
};
