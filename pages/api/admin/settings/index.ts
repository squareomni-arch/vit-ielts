import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin.from("site_settings").select("*");
            if (error) throw error;

            // Convert to key-value map
            const settings: Record<string, unknown> = {};
            (data ?? []).forEach((s: { key: string; value: Record<string, unknown> }) => {
                settings[s.key] = s.value;
            });

            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { key, value } = req.body;
            if (!key) return res.status(400).json({ success: false, error: "Missing key" });

            // Upsert
            const { data, error } = await supabaseAdmin
                .from("site_settings")
                .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
