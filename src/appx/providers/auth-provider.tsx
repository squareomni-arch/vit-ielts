import { useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "~supabase/client";
import { useAppContext } from "@/appx/providers";
import { useRouter } from "next/router";
import { ROUTES } from "@/shared/routes";
import { isAdminRole, isTeacherRole } from "~lib/parseRoles";

type SignUpParams = {
  name: string;
  email: string;
  password: string;
  date_of_birth?: string; // ISO format or "DD/MM/YYYY"
  gender?: "male" | "female" | string;
  target_band?: number; // single band goal, stored across all four skills
};

export const useAuth = () => {
  const supabase = createClient();
  const router = useRouter();

  const { masterData } = useAppContext();

  // Safe access with default values for SSR/prerender
  const viewer = masterData?.viewer;
  const isSignedIn = Boolean(viewer);

  // Global teacher capability (admin-granted) — gates the teacher dashboard /
  // "Tạo lớp mới" entrypoints. Derived from the roles already on the viewer.
  const isTeacher = isTeacherRole(
    (viewer?.roles?.nodes ?? []).map((n) => n.name)
  );

  const signIn = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // Check role — admin accounts must NOT log in via user login page
    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("roles")
        .eq("id", data.user.id)
        .single();

      if (isAdminRole(profile?.roles)) {
        // Sign out immediately and block access
        await supabase.auth.signOut();
        throw new Error(`Admin accounts must sign in at ${ROUTES.ADMIN.LOGIN}.`);
      }
    }

    // Regular user: redirect to ?redirect param or home
    const explicitRedirect = router.query.redirect as string | undefined;
    window.location.href = explicitRedirect || "/";

    return data;
  };

  const signInWithGoogle = async () => {
    // Pass redirect param through to the OAuth callback
    const redirectParam = (router.query.redirect as string) || "/";
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectParam)}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) throw error;
    return data;
  };

  const signUp = async ({
    name,
    email,
    password,
    date_of_birth,
    gender,
    target_band,
  }: SignUpParams) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, date_of_birth: date_of_birth || null, gender: gender || null },
      },
    });
    if (error) throw error;

    // Insert into users table
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        name,
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        // The signup form exposes a single "target band"; mirror the profile
        // page and store it across all four skills in the target_score JSONB.
        ...(target_band != null
          ? {
              target_score: {
                reading: target_band,
                listening: target_band,
                speaking: target_band,
                writing: target_band,
              },
            }
          : {}),
      });
    }

    return data;
  };

  const signOut = async () => {
    const isOnAdminPage = window.location.pathname.startsWith(ROUTES.ADMIN.BASE);
    await supabase.auth.signOut();
    window.location.href = isOnAdminPage ? ROUTES.ADMIN.LOGIN : "/account/login";
  };

  return {
    isSignedIn,
    isTeacher,
    currentUser: viewer,
    signIn,
    signInWithGoogle,
    signOut,
    signUp,
  };
};

/**
 * Pages that should NOT trigger an automatic redirect when the Supabase
 * session ends. The login pages themselves obviously don't need to bounce
 * to login; the OAuth callback is mid-flight and SIGNED_OUT briefly fires
 * before SIGNED_IN.
 */
const SIGNOUT_REDIRECT_BLOCKLIST = [
  "/account/login",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
  ROUTES.ADMIN.LOGIN,
  "/auth/callback",
];

const isPublicAuthPath = (pathname: string) =>
  SIGNOUT_REDIRECT_BLOCKLIST.some((p) => pathname.startsWith(p));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { masterData } = useAppContext();
  const hasViewer = Boolean(masterData?.viewer);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // SIGNED_OUT: refresh token rejected (expired / revoked / used by
      // another tab). The SSR-rendered UI still thinks the user is signed
      // in — bounce them to login so they don't keep typing answers into
      // a dead session.
      if (event === "SIGNED_OUT" && hasViewer) {
        if (typeof window === "undefined") return;
        const onAdmin = window.location.pathname.startsWith(ROUTES.ADMIN.BASE);
        if (isPublicAuthPath(window.location.pathname)) return;
        const target = onAdmin ? ROUTES.ADMIN.LOGIN : "/account/login";
        const redirect = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `${target}?redirect=${redirect}`;
        return;
      }

      // SIGNED_IN fired on a tab whose SSR pageProps say "no viewer" —
      // happens when the user logs in in another tab. Reload so SSR data
      // matches the new session.
      //
      // Loop breaker: when SSR can't see the session for any reason
      // (cookie chunking, statement timeout returning null masterData,
      // middleware refresh failure), reloading does NOT fix hasViewer and
      // the listener fires again on every reload — runaway hundreds of
      // reloads. Cool down for 5s after each reload so we surface the
      // problem instead of looping.
      if (event === "SIGNED_IN" && !hasViewer && session) {
        if (typeof window === "undefined") return;
        if (isPublicAuthPath(window.location.pathname)) return;
        const RELOAD_KEY = "_auth_signin_reload_at";
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
        if (Date.now() - last < 5000) return;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [hasViewer]);

  return <>{children}</>;
};
