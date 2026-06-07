import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { parseRoles } from "~lib/parseRoles";

/**
 * Grant or revoke the global `teacher` role for a user. The role is stored in
 * the `users.roles` JSONB array; this endpoint adds/removes "teacher" while
 * preserving the user's other roles (e.g. "subscriber").
 *
 * Body: { action: "grant" | "revoke" }
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing user ID" });
    }

    const { action } = req.body ?? {};
    if (action !== "grant" && action !== "revoke") {
        return res.status(400).json({ success: false, error: "Invalid action. Use 'grant' or 'revoke'" });
    }

    try {
        const { data: current, error: readError } = await supabaseAdmin
            .from("users")
            .select("roles")
            .eq("id", id)
            .single();

        if (readError) throw readError;

        const roles = new Set(parseRoles(current?.roles));
        if (action === "grant") roles.add("teacher");
        else roles.delete("teacher");

        const nextRoles = Array.from(roles);

        const { data, error } = await supabaseAdmin
            .from("users")
            .update({ roles: nextRoles })
            .eq("id", id)
            .select("roles")
            .single();

        if (error) throw error;

        return res.status(200).json({
            success: true,
            message: action === "grant" ? "Đã cấp quyền Giáo viên" : "Đã thu hồi quyền Giáo viên",
            data,
        });
    } catch (error) {
        console.error(`[API /api/admin/users/${id}/toggle-teacher]`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
