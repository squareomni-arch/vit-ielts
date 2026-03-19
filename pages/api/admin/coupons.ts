import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

/** Enhanced coupons API supporting type, expires_at fields */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("coupons")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return res.status(200).json({ success: true, data: data ?? [] });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "POST") {
        try {
            const { code, type, value, max_uses, expires_at } = req.body;
            if (!code || !value) return res.status(400).json({ success: false, error: "code and value are required" });

            const { data, error } = await supabaseAdmin
                .from("coupons")
                .insert({
                    code,
                    type: type || "fixed",
                    value: Number(value),
                    max_uses: max_uses ? Number(max_uses) : null,
                    expires_at: expires_at || null,
                    is_active: true,
                    current_uses: 0,
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes("duplicate") || msg.includes("unique")) {
                return res.status(400).json({ success: false, error: "Mã giảm giá đã tồn tại" });
            }
            return res.status(500).json({ success: false, error: msg });
        }
    }

    if (req.method === "PUT") {
        try {
            const { id, code, type, value, max_uses, is_active, expires_at } = req.body;
            if (!id) return res.status(400).json({ success: false, error: "Missing id" });

            const updateData: Record<string, unknown> = {};
            if (code !== undefined) updateData.code = code;
            if (type !== undefined) updateData.type = type;
            if (value !== undefined) updateData.value = Number(value);
            if (max_uses !== undefined) updateData.max_uses = max_uses ? Number(max_uses) : null;
            if (is_active !== undefined) updateData.is_active = Boolean(is_active);
            if (expires_at !== undefined) updateData.expires_at = expires_at;

            const { data, error } = await supabaseAdmin
                .from("coupons")
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

    if (req.method === "DELETE") {
        try {
            const { id } = req.query;
            if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing id" });

            const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
            if (error) throw error;
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
