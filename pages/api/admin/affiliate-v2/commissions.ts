import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("commissions")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return res.status(200).json({ success: true, data: data ?? [] });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { id, status } = req.body;
            if (!id || !status) return res.status(400).json({ success: false, error: "id and status required" });

            const { data, error } = await supabaseAdmin
                .from("commissions")
                .update({ status })
                .eq("id", id)
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
