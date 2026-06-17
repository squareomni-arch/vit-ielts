import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { createNotification } from "~services/notification";

/**
 * Drop an in-app "please verify your email" reminder into the bell.
 *
 * POST /api/notifications/verify-reminder
 *
 * Called right after sign-up: with email confirmation disabled the user
 * already has a session but `email_confirmed_at` is null until they verify.
 * We create a single warning notification (deduped via entity_id) so the bell
 * nudges them — instead of blocking login. No-op once the email is confirmed.
 */

// Stable entity id so we never stack duplicate reminders for the same user.
const VERIFY_ENTITY_ID = "email-verification";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const supabase = createApiSupabase(req, res);
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ success: false, error: "Vui lòng đăng nhập" });
        }

        // Already verified — nothing to remind about.
        if (user.email_confirmed_at) {
            return res.status(200).json({ success: true, created: false });
        }

        // Dedupe: skip if an unread verification reminder already exists.
        const { data: existing } = await supabaseAdmin
            .from("notifications")
            .select("id")
            .eq("user_id", user.id)
            .eq("entity_id", VERIFY_ENTITY_ID)
            .eq("is_read", false)
            .maybeSingle();
        if (existing) {
            return res.status(200).json({ success: true, created: false });
        }

        await createNotification(supabaseAdmin, {
            userId: user.id,
            title: "Xác thực email của bạn",
            message:
                "Tài khoản đã được tạo. Vui lòng kiểm tra hộp thư và xác thực địa chỉ email để bảo mật tài khoản.",
            type: "warning",
            entityId: VERIFY_ENTITY_ID,
            link: "/account/my-profile",
        });

        return res.status(200).json({ success: true, created: true });
    } catch (error) {
        console.error("[API /api/notifications/verify-reminder]", error);
        return res.status(500).json({ success: false, error: "Failed to create reminder" });
    }
}
