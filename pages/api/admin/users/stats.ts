import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

/**
 * GET /api/admin/users/stats
 * Returns aggregated user counts for the WordPress-style filter tabs.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method !== "GET") {
        return res
            .status(405)
            .json({ success: false, error: "Method not allowed" });
    }

    try {
        const now = new Date().toISOString();

        // Run all counts in parallel for performance
        const [
            totalRes,
            adminRes,
            proActiveRes,
            proExpiredRes,
            freeRes,
        ] = await Promise.all([
            // Total users
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true }),

            // Administrators
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .contains("roles", ["administrator"]),

            // Pro active (is_pro = true AND expiration in future)
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .eq("is_pro", true)
                .gt("pro_expiration_date", now),

            // Pro expired (has expiration date in the past)
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .not("pro_expiration_date", "is", null)
                .lt("pro_expiration_date", now),

            // Free users (is_pro = false)
            supabaseAdmin
                .from("users")
                .select("id", { count: "exact", head: true })
                .eq("is_pro", false),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                total: totalRes.count ?? 0,
                administrator: adminRes.count ?? 0,
                subscriber:
                    (totalRes.count ?? 0) - (adminRes.count ?? 0),
                proActive: proActiveRes.count ?? 0,
                proExpired: proExpiredRes.count ?? 0,
                free: freeRes.count ?? 0,
            },
        });
    } catch (error) {
        console.error("[API /api/admin/users/stats]", error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal error",
        });
    }
}
