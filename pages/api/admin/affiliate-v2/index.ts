import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("affiliates")
                .select("*, users(email, name)")
                .order("created_at", { ascending: false });
            if (error) throw error;

            // Map user data for compatibility
            const mapped = (data ?? []).map((a: Record<string, unknown>) => ({
                ...a,
                user: a.users ?? null,
            }));

            return res.status(200).json({ success: true, data: mapped });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
