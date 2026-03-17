import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Build a secure Set-Cookie header string from Supabase cookie options.
 * - Secure: only transmit over HTTPS (production only)
 * - SameSite=Lax: CSRF protection while allowing top-level navigations
 * - HttpOnly is intentionally NOT set — Supabase JS client needs to read these cookies
 */
function buildCookieString(name: string, value: string, options?: CookieOptions): string {
    const parts = [`${name}=${value}`, `Path=${options?.path ?? "/"}`];
    if (options?.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (isProduction) parts.push("Secure");
    parts.push("SameSite=Lax");
    return parts.join("; ");
}

export function createServerSupabase(context: GetServerSidePropsContext) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
                    context.res.setHeader("Set-Cookie", cookieStrings);
                },
            },
        }
    );
}

/**
 * Create Supabase client for Next.js API routes.
 * Similar to createServerSupabase but accepts NextApiRequest/NextApiResponse.
 */
export function createApiSupabase(req: NextApiRequest, res: NextApiResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
                    res.setHeader("Set-Cookie", cookieStrings);
                },
            },
        }
    );
}

