import { GetServerSideProps } from "next";
import { createServerSupabase } from "~supabase/server";
import { getMasterData } from "~supabase/getMasterData";
import { getProgressOverview } from "~services/progress";
import { ROUTES } from "@/shared/routes";

export { PageMyProgress } from "./ui";

export const getServerSideProps: GetServerSideProps = async (context) => {
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

  const [master, progressOverview] = await Promise.all([
    getMasterData(context),
    getProgressOverview(supabase, user.id),
  ]);

  return {
    props: {
      ...master.props,
      progressOverview,
    },
  };
};
