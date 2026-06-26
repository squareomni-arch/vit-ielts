import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware
 *
 * Two responsibilities:
 *  1. Refresh the Supabase auth session on every page request. With
 *     @supabase/ssr the access token has a short TTL (default 1h) and the
 *     ONLY safe place to refresh it on the Pages Router is middleware.
 *     Without this, a student opens a test, works for an hour, then gets
 *     bounced to the login screen on the next navigation — which is exactly
 *     the bug we are fixing here.
 *  2. Track affiliate `?ref=XXX` cookies (last-click-wins, 30 days).
 */

const AFFILIATE_COOKIE_NAME = "affiliate_ref";
const COOKIE_MAX_AGE_DAYS = 30;
// Hard cap on the auth-refresh round trip. If Supabase is slow / unreachable,
// we'd rather pass through with a stale cookie than let the whole request
// hang up to the Edge runtime's 25s timeout (MIDDLEWARE_INVOCATION_TIMEOUT).
const AUTH_REFRESH_TIMEOUT_MS = 2000;

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
      return true;
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  // ─── 0. Hide the admin CMS behind a secret path ───────────────────────
  // pages/admin/** is reachable only through the secret prefix (a
  // next.config rewrite maps it onto /admin). A direct hit on /admin from
  // anyone without a Supabase session is a 404 — anonymous scanners never
  // see the login. Authenticated non-admins fall through to the per-page
  // withAdmin guard, which bounces them to "/".
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !hasSupabaseAuthCookie(request)
  ) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // Build the response we will eventually return. Both the affiliate logic
  // and the Supabase session refresh write Set-Cookie headers onto it.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Bypass ngrok warning page
  response.headers.set("ngrok-skip-browser-warning", "true");

  // ─── 1. Refresh Supabase session ───────────────────────────────────────
  // Skip entirely for anonymous visitors (no auth cookie) — there is nothing
  // to refresh, and most traffic is anonymous. Also skip on /auth/callback,
  // otherwise getUser/getSession would clear the PKCE code_verifier cookie
  // before the client can exchange it.
  const shouldRefresh =
    hasSupabaseAuthCookie(request) &&
    !request.nextUrl.pathname.startsWith("/auth/callback");

  if (shouldRefresh) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({
              request: { headers: request.headers },
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Race the refresh against a short timeout so a slow/unreachable Supabase
    // never blocks the response. On timeout we pass through with the existing
    // (possibly soon-to-expire) cookies; downstream getServerSideProps will
    // refresh again on its own.
    await Promise.race([
      supabase.auth.getSession().catch(() => undefined),
      new Promise<void>((resolve) =>
        setTimeout(resolve, AUTH_REFRESH_TIMEOUT_MS)
      ),
    ]);
  }

  // ─── 2. Affiliate tracking ─────────────────────────────────────────────
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return response;
  }

  // Validate ref format (alphanumeric, hyphens, underscores, max 100 chars)
  const isValid = /^[a-zA-Z0-9_-]{1,100}$/.test(ref);
  if (!isValid) {
    return response;
  }

  // Skip if same ref already set
  const existing = request.cookies.get(AFFILIATE_COOKIE_NAME);
  if (existing?.value === ref) {
    return response;
  }

  // Strip ?ref= and redirect to the clean URL, carrying the refreshed
  // Supabase Set-Cookie headers along with the new affiliate cookie.
  const cleanUrl = new URL(request.nextUrl);
  cleanUrl.searchParams.delete("ref");
  const redirect = NextResponse.redirect(cleanUrl, { status: 302 });
  response.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value, cookie);
  });
  redirect.cookies.set(AFFILIATE_COOKIE_NAME, ref, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  });
  redirect.headers.set("ngrok-skip-browser-warning", "true");
  return redirect;
}

export const config = {
  matcher: [
    /*
     * Run on every page request EXCEPT:
     * - api routes (they refresh their own session via createApiSupabase)
     * - _next internals — including _next/data (the JSON payload for client-side
     *   navigation). Those requests still hit getServerSideProps, which runs
     *   its own auth refresh via createServerSupabase, so refreshing in
     *   middleware here is duplicate work that doubles Supabase auth load.
     * - static assets
     */
    "/((?!api|_next/static|_next/image|_next/data|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
