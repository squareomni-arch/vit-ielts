import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { supabaseAdmin } from "~supabase/admin";
import { isAdminRole } from "~lib/parseRoles";

/**
 * SSR guard — redirects non-admin users.
 * Checks Supabase auth session + roles column in users table.
 *
 * Usage:
 *   export const getServerSideProps = withAdmin;
 *
 * Or with extra logic:
 *   export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *     const guard = await withAdmin(ctx);
 *     if ("redirect" in guard) return guard;
 *     // ... extra logic
 *     return { props: { ...guard.props, extraData } };
 *   };
 */
export const withAdmin: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabase(context);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → redirect to login
  if (!user) {
    return {
      redirect: {
        destination: `/account/login?redirect=${encodeURIComponent(context.resolvedUrl)}`,
        statusCode: 302,
      },
    };
  }

  // Check admin role via users table
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("roles")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdminRole(profile?.roles)) {
    return {
      redirect: {
        destination: "/",
        statusCode: 302,
      },
    };
  }

  return { props: {} };
};
