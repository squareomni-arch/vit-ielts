import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { ServerResponse } from "http";

const isProduction = process.env.NODE_ENV === "production";

import { wrapWithMockAuth } from "./mockAuth";

function mockClientAuth(client: any, cookies?: Record<string, string>) {
    return wrapWithMockAuth(client, cookies);
}

/**
 * Append Set-Cookie values without clobbering any cookies already set on the
 * response (e.g. by middleware or earlier in the request lifecycle).
 */
function appendSetCookie(
    res: ServerResponse | NextApiResponse,
    cookieStrings: string[],
): void {
    if (cookieStrings.length === 0) return;
    const existing = res.getHeader("Set-Cookie");
    const existingArray = Array.isArray(existing)
        ? existing.map((v) => String(v))
        : existing != null
            ? [String(existing)]
            : [];
    res.setHeader("Set-Cookie", [...existingArray, ...cookieStrings]);
}

/**
 * Build a secure Set-Cookie header string from Supabase cookie options.
 * - Secure: only transmit over HTTPS (production only)
 * - SameSite=Lax: CSRF protection while allowing top-level navigations
 * - HttpOnly is intentionally NOT set — Supabase JS client needs to read these cookies
 */
function buildCookieString(name: string, value: string, options?: CookieOptions): string {
    const parts = [`${name}=${value}`, `Path=${options?.path ?? "/"}`];
    // typeof check is required: when Supabase deletes a cookie it passes maxAge=0,
    // and when it persists a session it passes a positive number. Using a truthy
    // check would drop both the deletion (0) and silently leave persistent
    // cookies as session cookies when maxAge is missing.
    if (typeof options?.maxAge === "number") parts.push(`Max-Age=${options.maxAge}`);
    if (options?.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`);
    if (options?.domain) parts.push(`Domain=${options.domain}`);
    if (isProduction) parts.push("Secure");
    parts.push("SameSite=Lax");
    return parts.join("; ");
}

export function createServerSupabase(context: GetServerSidePropsContext) {
    return mockClientAuth(createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            },
            cookies: {
                getAll() {
                    return Object.entries(context.req.cookies).map(([name, value]) => ({
                        name,
                        value: value || "",
                    }));
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options?: CookieOptions;
                    }[]
                ) {
                    const cookieStrings = cookiesToSet.map(({ name, value, options }) =>
                        buildCookieString(name, value, options)
                    );
                    appendSetCookie(context.res, cookieStrings);
                },
            },
        }
    ), context.req.cookies);
}

/**
 * Server client for admin pages — reads/writes cookies under the 'sb-admin-auth' key,
 * keeping admin sessions isolated from regular user sessions.
 */
export function createAdminServerSupabase(context: GetServerSidePropsContext) {
    return mockClientAuth(createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: { name: "sb-admin-auth" },
            global: {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            },
            cookies: {
                getAll() {
                    return Object.entries(context.req.cookies).map(([name, value]) => ({
                        name,
                        value: value || "",
                    }));
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options?: CookieOptions;
                    }[]
                ) {
                    const cookieStrings = cookiesToSet.map(({ name, value, options }) =>
                        buildCookieString(name, value, options)
                    );
                    appendSetCookie(context.res, cookieStrings);
                },
            },
        }
    ), context.req.cookies);
}

/**
 * Create Supabase client for Next.js API routes.
 * Similar to createServerSupabase but accepts NextApiRequest/NextApiResponse.
 */
export function createApiSupabase(req: NextApiRequest, res: NextApiResponse) {
    return mockClientAuth(createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            },
            cookies: {
                getAll() {
                    return Object.entries(req.cookies).map(([name, value]) => ({
                        name,
                        value: value || "",
                    }));
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options?: CookieOptions;
                    }[]
                ) {
                    const cookieStrings = cookiesToSet.map(({ name, value, options }) =>
                        buildCookieString(name, value, options)
                    );
                    appendSetCookie(res, cookieStrings);
                },
            },
        }
    ), req.cookies);
}

/**
 * Admin-specific API route client — reads auth from 'sb-admin-auth' cookies,
 * keeping admin sessions isolated from regular user sessions.
 */
export function createAdminApiSupabase(req: NextApiRequest, res: NextApiResponse) {
    return mockClientAuth(createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: { name: "sb-admin-auth" },
            global: {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                },
            },
            cookies: {
                getAll() {
                    return Object.entries(req.cookies).map(([name, value]) => ({
                        name,
                        value: value || "",
                    }));
                },
                setAll(
                    cookiesToSet: {
                        name: string;
                        value: string;
                        options?: CookieOptions;
                    }[]
                ) {
                    const cookieStrings = cookiesToSet.map(({ name, value, options }) =>
                        buildCookieString(name, value, options)
                    );
                    appendSetCookie(res, cookieStrings);
                },
            },
        }
    ), req.cookies);
}

