import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const adminUser = await requireAdmin(req, res);
    if (!adminUser) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing user ID" });
    }

    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    try {
        const { password } = req.body as { password?: string };
        const trimmedPassword = password?.trim();

        if (!trimmedPassword || trimmedPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: "Mật khẩu mới phải có ít nhất 8 ký tự",
            });
        }

        const { data: targetUser, error: targetUserError } = await supabaseAdmin
            .from("users")
            .select("id, email, name")
            .eq("id", id)
            .single();

        if (targetUserError) throw targetUserError;
        if (!targetUser) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: trimmedPassword,
        });

        if (authError) throw authError;

        await logActivity(supabaseAdmin, {
            userId: adminUser.id,
            userEmail: adminUser.email ?? undefined,
            action: "update",
            entityType: "user",
            entityId: id,
            entityTitle: targetUser.name || targetUser.email,
            ipAddress: getClientIP(req),
        });

        return res.status(200).json({
            success: true,
            message: "Đã đặt lại mật khẩu cho user",
        });
    } catch (error) {
        console.error(`[API /api/admin/users/${id}/reset-password] POST`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
