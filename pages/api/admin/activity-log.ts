import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { getActivityLogs } from "~services/activity-log";
import type { ActivityAction, ActivityEntityType } from "~services/activity-log";

/**
 * GET /api/admin/activity-log
 *
 * Query params:
 * - action: filter by action type
 * - entityType: filter by entity type
 * - userId: filter by user
 * - search: text search (entity_title, user_email, user_name)
 * - dateFrom / dateTo: date range filter
 * - page / pageSize: pagination
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    if (req.method !== "GET") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const user = await requireAdmin(req, res);
    if (!user) return;

    try {
        const {
            action,
            entityType,
            userId,
            search,
            dateFrom,
            dateTo,
            page,
            pageSize,
        } = req.query;

        const result = await getActivityLogs(supabaseAdmin, {
            action: action as ActivityAction | undefined,
            entityType: entityType as ActivityEntityType | undefined,
            userId: userId as string | undefined,
            search: search as string | undefined,
            dateFrom: dateFrom as string | undefined,
            dateTo: dateTo as string | undefined,
            page: page ? parseInt(page as string, 10) : 1,
            pageSize: pageSize ? parseInt(pageSize as string, 10) : 30,
        });

        return res.status(200).json({
            success: true,
            data: result.data,
            count: result.count,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Failed to fetch activity logs",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
