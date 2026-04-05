import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

/**
 * Admin Notifications API
 *
 * GET  /api/admin/notifications          → List notifications (unread first)
 * POST /api/admin/notifications          → Create notification (internal use)
 * PUT  /api/admin/notifications?id=xxx   → Mark as read
 * PUT  /api/admin/notifications?all=true → Mark all as read
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const user = await requireAdmin(req, res);
    if (!user) return;

    // ── GET: List notifications ───────────────────────────────────────────
    if (req.method === "GET") {
        try {
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const unreadOnly = req.query.unreadOnly === "true";

            let query = supabaseAdmin
                .from("admin_notifications")
                .select("*", { count: "exact" })
                .order("created_at", { ascending: false })
                .limit(limit);

            if (unreadOnly) {
                query = query.eq("is_read", false);
            }

            const { data, error, count } = await query;
            if (error) throw error;

            // Unread count
            const { count: unreadCount } = await supabaseAdmin
                .from("admin_notifications")
                .select("*", { count: "exact", head: true })
                .eq("is_read", false);

            return res.status(200).json({
                success: true,
                data: data ?? [],
                count: count ?? 0,
                unreadCount: unreadCount ?? 0,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to fetch notifications",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ── POST: Create notification ─────────────────────────────────────────
    if (req.method === "POST") {
        try {
            const { title, message, type, entityType, entityId, link } = req.body;

            if (!title) {
                return res.status(400).json({ success: false, error: "Title is required" });
            }

            const { data, error } = await supabaseAdmin
                .from("admin_notifications")
                .insert({
                    title,
                    message: message ?? null,
                    type: type ?? "info",
                    entity_type: entityType ?? null,
                    entity_id: entityId ?? null,
                    link: link ?? null,
                })
                .select()
                .single();

            if (error) throw error;

            return res.status(201).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to create notification",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // ── PUT: Mark as read ─────────────────────────────────────────────────
    if (req.method === "PUT") {
        try {
            const { id, all } = req.query;

            if (all === "true") {
                // Mark all as read
                const { error } = await supabaseAdmin
                    .from("admin_notifications")
                    .update({ is_read: true })
                    .eq("is_read", false);

                if (error) throw error;

                return res.status(200).json({
                    success: true,
                    message: "All notifications marked as read",
                });
            }

            if (!id) {
                return res.status(400).json({ success: false, error: "Missing id or all=true" });
            }

            const { error } = await supabaseAdmin
                .from("admin_notifications")
                .update({ is_read: true })
                .eq("id", id as string);

            if (error) throw error;

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: "Failed to update notification",
                details: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
