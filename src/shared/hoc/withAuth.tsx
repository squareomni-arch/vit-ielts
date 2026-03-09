import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";

/**
 * SSR guard — redirects unauthenticated users to login.
 * Uses Supabase session instead of legacy cookie-based auth.
 */
export async function withAuth(
  context: GetServerSidePropsContext,
): ReturnType<GetServerSideProps> {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return {
      props: {},
    };
  }

  return {
    redirect: {
      destination: `/account/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
      statusCode: 302,
    },
  };
}

