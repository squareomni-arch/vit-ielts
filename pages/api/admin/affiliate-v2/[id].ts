import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing ID" });

    if (req.method === "PUT") {
        try {
            const { status, commission_rate, custom_link } = req.body;
            const updateData: Record<string, unknown> = {};
            if (status !== undefined) updateData.status = status;
            if (commission_rate !== undefined) updateData.commission_rate = Number(commission_rate);
            if (custom_link !== undefined) updateData.custom_link = custom_link;

            const { data, error } = await supabaseAdmin
                .from("affiliates")
                .update(updateData)
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
