import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getPostBySlug } from "~services/post";
import { ROUTES } from "@/shared/routes";
import { isAdminRole } from "~lib/parseRoles";

export { PageSingle } from "./ui";

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
  singleSlug: string
): ReturnType<GetServerSideProps> => {
  const supabase = createServerSupabase(context);

  let post: Awaited<ReturnType<typeof getPostBySlug>>;
  try {
    post = await getPostBySlug(supabase, singleSlug);
  } catch (error) {
    console.error("Error fetching post single:", error);
    return { notFound: true };
  }

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

    const isPro =
      isAdminRole(profile?.roles) ||
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
