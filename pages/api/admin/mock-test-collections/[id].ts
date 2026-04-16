import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing collection ID" });
    }

    // ────────────────────────────────────────────────
    // GET /api/admin/mock-test-collections/[id]
    // ────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("mock_test_collections")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, error: "Collection not found" });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as { code?: string };
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Collection not found" });
            }
            console.error(`[API /api/admin/mock-test-collections/${id}] GET`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ────────────────────────────────────────────────
    // PUT /api/admin/mock-test-collections/[id]
    // ────────────────────────────────────────────────
    if (req.method === "PUT") {
        try {
            const { title, slug, mock_test_ids, featured_image } = req.body;

            const updatePayload: Record<string, unknown> = {};
            if (title !== undefined) updatePayload.title = title;
            if (slug !== undefined) updatePayload.slug = slug;
            if (mock_test_ids !== undefined) updatePayload.mock_test_ids = mock_test_ids;
            if (featured_image !== undefined) updatePayload.featured_image = featured_image;

            const { data, error } = await supabaseAdmin
                .from("mock_test_collections")
                .update(updatePayload)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "update",
                entityType: "mock_test_collection",
                entityId: id,
                entityTitle: title || data?.title,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(`[API /api/admin/mock-test-collections/${id}] PUT`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ────────────────────────────────────────────────
    // DELETE /api/admin/mock-test-collections/[id]
    // ────────────────────────────────────────────────
    if (req.method === "DELETE") {
        try {
            const { error } = await supabaseAdmin
                .from("mock_test_collections")
                .delete()
                .eq("id", id);

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "mock_test_collection",
                entityId: id,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, message: "Collection deleted" });
        } catch (error) {
            console.error(`[API /api/admin/mock-test-collections/${id}] DELETE`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
