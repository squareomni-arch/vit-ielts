import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { logActivity, getClientIP } from "~services/activity-log";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
        return res.status(400).json({ success: false, error: "Missing mock test ID" });
    }

    // ────────────────────────────────────────────────
    // GET /api/admin/mock-tests/[id]
    // ────────────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const { data, error } = await supabaseAdmin
                .from("mock_tests")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, error: "Mock test not found" });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            const pgErr = error as { code?: string };
            if (pgErr?.code === "PGRST116") {
                return res.status(404).json({ success: false, error: "Mock test not found" });
            }
            console.error(`[API /api/admin/mock-tests/${id}] GET`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ────────────────────────────────────────────────
    // PUT /api/admin/mock-tests/[id]
    // ────────────────────────────────────────────────
    if (req.method === "PUT") {
        try {
            const { title, slug, practice_tests } = req.body;

            const updatePayload: Record<string, unknown> = {};
            if (title !== undefined) updatePayload.title = title;
            if (slug !== undefined) updatePayload.slug = slug;
            if (practice_tests !== undefined) updatePayload.practice_tests = practice_tests;

            const { data, error } = await supabaseAdmin
                .from("mock_tests")
                .update(updatePayload)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "update",
                entityType: "mock_test",
                entityId: id,
                entityTitle: title || data?.title,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error(`[API /api/admin/mock-tests/${id}] PUT`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    // ────────────────────────────────────────────────
    // DELETE /api/admin/mock-tests/[id]
    // ────────────────────────────────────────────────
    if (req.method === "DELETE") {
        try {
            const { error } = await supabaseAdmin
                .from("mock_tests")
                .delete()
                .eq("id", id);

            if (error) throw error;

            await logActivity(supabaseAdmin, {
                userId: user.id,
                userEmail: user.email ?? undefined,
                action: "delete",
                entityType: "mock_test",
                entityId: id,
                ipAddress: getClientIP(req),
            });

            return res.status(200).json({ success: true, message: "Mock test deleted" });
        } catch (error) {
            console.error(`[API /api/admin/mock-tests/${id}] DELETE`, error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : "Internal error",
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
