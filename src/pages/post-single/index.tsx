import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getPostBySlug } from "~services/post";
import { ROUTES } from "@/shared/routes";

export { PageSingle } from "./ui";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
  singleSlug: string
): ReturnType<GetServerSideProps> => {
  const supabase = createServerSupabase(context);

  const post = await getPostBySlug(supabase, singleSlug);

  if (!post) {
    return {
      notFound: true,
    };
  }

  // Check Pro access
  if (post.pro_user_only) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        redirect: {
          destination: ROUTES.HOME,
          permanent: false,
        },
      };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_pro, pro_expiration_date, roles")
      .eq("id", user.id)
      .single();

    const roles: string[] = Array.isArray(profile?.roles) ? profile.roles : [];
    const isPro =
      roles.includes("administrator") ||
      (profile?.is_pro &&
        profile?.pro_expiration_date &&
        new Date(profile.pro_expiration_date) > new Date());

    if (!isPro) {
      return {
        redirect: {
          destination: ROUTES.HOME,
          permanent: false,
        },
      };
    }
  }

  return {
    props: {
      post,
    },
  };
};
