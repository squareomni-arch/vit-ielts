import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { activateProAccount } from "~services/user";
import { requireAdmin } from "~lib/admin-auth";

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

    try {
        const { action, durationMonths = 1 } = req.body;

        if (action === "activate") {
            // Activate Pro account
            const result = await activateProAccount(supabaseAdmin, id, Number(durationMonths));
            return res.status(200).json({
                success: true,
                message: `Pro activated for ${durationMonths} month(s)`,
                data: result,
            });
        }

        if (action === "deactivate") {
            // Deactivate Pro
            const { data, error } = await supabaseAdmin
                .from("users")
                .update({ is_pro: false })
                .eq("id", id)
                .select("is_pro, pro_expiration_date")
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: "Pro deactivated",
                data,
            });
        }

        return res.status(400).json({ success: false, error: "Invalid action. Use 'activate' or 'deactivate'" });
    } catch (error) {
        console.error(`[API /api/admin/users/${id}/toggle-pro]`, error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
