import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") return res.status(400).json({ success: false, error: "Missing ID" });

    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin.from("posts").select("*").eq("id", id).single();
            if (error) throw error;
            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as any;
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Post not found" });
            }
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { title, slug, content, excerpt, featured_image, status, pro_user_only, categories, seo } = req.body;
            const updateData: Record<string, unknown> = {};
            if (title !== undefined) updateData.title = title;
            if (slug !== undefined) updateData.slug = slug;
            if (content !== undefined) updateData.content = content;
            if (excerpt !== undefined) updateData.excerpt = excerpt;
            if (featured_image !== undefined) updateData.featured_image = featured_image;
            if (status !== undefined) {
                updateData.status = status;
                if (status === "published") updateData.published_at = new Date().toISOString();
            }
            if (pro_user_only !== undefined) updateData.pro_user_only = pro_user_only;
            if (categories !== undefined) updateData.categories = categories;
            if (seo !== undefined) updateData.seo = seo;

            const { data, error } = await supabaseAdmin.from("posts").update(updateData).eq("id", id).select().single();
            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: status === "published" ? "publish" : "update",
                entityType: "post",
                entityId: id,
                entityTitle: title || data?.title,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }

    if (req.method === "DELETE") {
        try {
            const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "post",
                entityId: id,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Internal error" });
        }
    }
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
