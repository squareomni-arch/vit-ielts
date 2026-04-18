import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";

/**
 * SSR guard — redirects unauthenticated users to login.
 * Uses Supabase session instead of legacy cookie-based auth.
 *
 * When ?preview=true, also checks the admin session (sb-admin-auth cookies)
 * so admins logged in via the admin panel can access preview mode.
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

  // If preview mode, also check admin session
  if (context.query.preview === "true") {
    const { createAdminServerSupabase } = await import("~supabase/server");
    const adminSupabase = createAdminServerSupabase(context);
    const { data: { user: adminUser } } = await adminSupabase.auth.getUser();
    if (adminUser) {
      return {
        props: {},
      };
    }
  }

  return {
    redirect: {
      destination: `/account/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
      statusCode: 302,
    },
  };
}

