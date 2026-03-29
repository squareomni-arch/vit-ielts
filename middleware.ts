import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware — Affiliate Cookie Tracking
 *
 * Detects `?ref=XXX` on any page URL and sets an HttpOnly cookie
 * with a configurable expiry (30 days default).
 *
 * Last-click-wins model: a new `?ref` overwrites the previous cookie.
 */

const AFFILIATE_COOKIE_NAME = "affiliate_ref";
const COOKIE_MAX_AGE_DAYS = 30;

export function middleware(request: NextRequest) {
  const { nextUrl, cookies } = request;
  const ref = nextUrl.searchParams.get("ref");

  // No ref param → pass through
  if (!ref) {
    return NextResponse.next();
  }

  // Validate ref format (alphanumeric, hyphens, underscores, max 100 chars)
  const isValid = /^[a-zA-Z0-9_-]{1,100}$/.test(ref);
  if (!isValid) {
    return NextResponse.next();
  }

  // Check if same ref already set (avoid unnecessary set-cookie headers)
  const existing = cookies.get(AFFILIATE_COOKIE_NAME);
  if (existing?.value === ref) {
    return NextResponse.next();
  }

  // Remove the `ref` query param from the URL to keep it clean
  const cleanUrl = new URL(nextUrl);
  cleanUrl.searchParams.delete("ref");

  // Create response with redirect to clean URL
  const response = NextResponse.redirect(cleanUrl, { status: 302 });

  // Set the affiliate_ref cookie
  response.cookies.set(AFFILIATE_COOKIE_NAME, ref, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: "/",
  });

  return response;
}

/**
 * Only run middleware on page routes, not on API routes,
 * static files, images, etc.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
