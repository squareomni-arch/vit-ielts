import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";
import { createServerSupabase } from "~supabase/server";
import { isAdminRole } from "~lib/parseRoles";

/**
 * SSR guard — redirects authenticated users away from guest-only pages (login/register).
 * Admin users are redirected to /admin, regular users to home.
 * Uses Supabase session instead of legacy cookie-based auth.
 */
export async function withGuest(
  context: GetServerSidePropsContext,
  redirect?: string
): ReturnType<GetServerSideProps> {
  const supabase = createServerSupabase(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Determine redirect based on user role
    let destination = redirect || ROUTES.HOME;

    if (!redirect) {
      const { data: profile } = await supabase
        .from("users")
        .select("roles")
        .eq("id", user.id)
        .single();

      const isAdmin = isAdminRole(profile?.roles);

      if (isAdmin) {
        destination = "/admin";
      }
    }

    return {
      redirect: {
        destination,
        statusCode: 302,
      },
    };
  }

  return {
    props: {},
  };
}

