import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import {
    getUserNotifications,
    getUnreadCount,
    markNotificationRead,
    markAllRead,
} from "~services/notification";

/**
 * User Notifications API
 *
 * GET  /api/notifications            → { data, unreadCount } for current user
 * PUT  /api/notifications?id=xxx      → mark one read
 * PUT  /api/notifications?all=true    → mark all read
 *
 * Reads/writes are always scoped to the authenticated user.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const supabase = createApiSupabase(req, res);
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return res.status(401).json({ success: false, error: "Vui lòng đăng nhập để tiếp tục" });
    }

    if (req.method === "GET") {
        try {
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const [data, unreadCount] = await Promise.all([
                getUserNotifications(supabaseAdmin, user.id, { limit }),
                getUnreadCount(supabaseAdmin, user.id),
            ]);
            return res.status(200).json({ success: true, data, unreadCount });
        } catch (error) {
            console.error("[API /api/notifications GET]", error);
            return res.status(500).json({ success: false, error: "Failed to fetch notifications" });
        }
    }

    if (req.method === "PUT") {
        try {
            const { id, all } = req.query;
            if (all === "true") {
                await markAllRead(supabaseAdmin, user.id);
                return res.status(200).json({ success: true });
            }
            if (!id) {
                return res.status(400).json({ success: false, error: "Missing id or all=true" });
            }
            await markNotificationRead(supabaseAdmin, user.id, id as string);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error("[API /api/notifications PUT]", error);
            return res.status(500).json({ success: false, error: "Failed to update notification" });
        }
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
