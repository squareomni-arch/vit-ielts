import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { sendPasswordResetEmail } from "~services/email";

/**
 * Custom forgot-password flow.
 *
 * Replaces `supabase.auth.resetPasswordForEmail()` so we can send the email
 * through the project's branded SMTP template (services/email.ts) instead of
 * the default Supabase one.
 *
 * Flow:
 *   1. Validate the email payload.
 *   2. Ask Supabase Admin to mint a recovery action_link (token + redirect).
 *   3. Send that link via our own SMTP using sendPasswordResetEmail().
 *   4. Always respond 200 to avoid leaking which emails are registered.
 */

type ResponseData = { success: boolean };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveOrigin(req: NextApiRequest): string {
    const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (envSiteUrl) return envSiteUrl.replace(/\/$/, "");

    const proto = (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() || "http";
    const host =
        (req.headers["x-forwarded-host"] as string) ||
        (req.headers.host as string) ||
        "localhost:3000";
    return `${proto}://${host}`;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>,
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false });
    }

    const { email } = (req.body ?? {}) as { email?: unknown };

    if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
        // Reject obviously malformed input — frontend should never reach here.
        return res.status(400).json({ success: false });
    }

    const origin = resolveOrigin(req);
    const redirectTo = `${origin}/account/reset-password`;

    try {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "recovery",
            email,
            options: { redirectTo },
        });

        if (error || !data?.properties?.action_link) {
            // Don't surface "user not found" / rate-limit errors to the client —
            // respond success to avoid email enumeration.
            console.warn("[forgot-password] generateLink skipped:", error?.message);
            return res.status(200).json({ success: true });
        }

        await sendPasswordResetEmail(email, data.properties.action_link);
    } catch (err) {
        // Log but still respond 200 for the same reason as above.
        console.error("[forgot-password] unexpected error:", err);
    }

    return res.status(200).json({ success: true });
}
