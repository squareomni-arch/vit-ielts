import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing ID" });

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin.from("sample_essays").select("*").eq("id", id).single();
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as any;
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Sample essay not found" });
            }
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const body = req.body;
            const updateData: Record<string, unknown> = {};
            const fields = ["title", "slug", "content", "excerpt", "skill", "part", "question_type", "quarter", "year", "source", "topic", "task", "passage", "featured_image", "pro_user_only", "seo"];
            fields.forEach((f) => { if (body[f] !== undefined) updateData[f] = body[f]; });
            if (body.status !== undefined) {
                updateData.status = body.status;
                if (body.status === "published") updateData.published_at = new Date().toISOString();
            }

            const { data, error } = await supabaseAdmin.from("sample_essays").update(updateData).eq("id", id).select().single();
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { error } = await supabaseAdmin.from("sample_essays").delete().eq("id", id);
            if (error) throw error;
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
