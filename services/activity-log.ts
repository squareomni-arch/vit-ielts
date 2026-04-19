/**
 * Activity Log Service — Audit trail for admin actions
 *
 * Records who did what, when, and to which entity.
 * Used by all admin API routes for accountability.
 *
 * Usage:
 * ```ts
 * await logActivity(supabaseAdmin, {
 *   userId: user.id,
 *   userEmail: user.email,
 *   action: "update",
 *   entityType: "quiz",
 *   entityId: quiz.id,
 *   entityTitle: quiz.title,
 *   metadata: { changedFields: ["title", "status"] },
 *   ipAddress: req.headers["x-forwarded-for"],
 * });
 * ```
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { NextApiRequest } from "next";
import { sanitizeFilterValue } from "./lib/sanitize";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ActivityAction =
    | "create"
    | "update"
    | "delete"
    | "publish"
    | "unpublish"
    | "login"
    | "logout"
    | "bulk_update"
    | "bulk_delete"
    | "export";

export type ActivityEntityType =
    | "quiz"
    | "post"
    | "sample_essay"
    | "user"
    | "order"
    | "coupon"
    | "cms_config"
    | "mock_test"
    | "mock_test_collection"
    | "affiliate"
    | "payout"
    | "redirect"
    | "setting"
    | "media";

export type ActivityLogEntry = {
    id: string;
    user_id: string | null;
    user_email: string | null;
    user_name: string | null;
    action: ActivityAction;
    entity_type: ActivityEntityType;
    entity_id: string | null;
    entity_title: string | null;
    metadata: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
};

type LogActivityParams = {
    userId?: string;
    userEmail?: string;
    userName?: string;
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId?: string;
    entityTitle?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
};

// ─── Core Functions ────────────────────────────────────────────────────────

/**
 * Log an admin activity.
 * Uses supabaseAdmin (service_role) to bypass RLS.
 * Errors are caught silently — logging should never break the main operation.
 */
export async function logActivity(
    supabase: SupabaseClient,
    params: LogActivityParams,
): Promise<void> {
    try {
        await supabase.from("activity_logs").insert({
            user_id: params.userId ?? null,
            user_email: params.userEmail ?? null,
            user_name: params.userName ?? null,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId ?? null,
            entity_title: params.entityTitle ?? null,
            metadata: params.metadata ?? {},
            ip_address: params.ipAddress ?? null,
        });
    } catch {
        // Silently fail — logging should never break the main operation
        console.error("[ActivityLog] Failed to log activity:", params.action, params.entityType);
    }
}

/**
 * Helper: Extract IP from Next.js API request
 */
export function getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    if (Array.isArray(forwarded)) return forwarded[0];
    return req.socket.remoteAddress ?? "unknown";
}

/**
 * Query activity logs with pagination and filters
 */
export async function getActivityLogs(
    supabase: SupabaseClient,
    filters: {
        action?: ActivityAction;
        entityType?: ActivityEntityType;
        userId?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        page?: number;
        pageSize?: number;
    } = {},
): Promise<{ data: ActivityLogEntry[]; count: number }> {
    const page = filters.page || 1;
    const size = filters.pageSize || 30;

    let query = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

    if (filters.action) query = query.eq("action", filters.action);
    if (filters.entityType) query = query.eq("entity_type", filters.entityType);
    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
    if (filters.search) {
        const s = sanitizeFilterValue(filters.search);
        if (s) {
            query = query.or(
                `entity_title.ilike.%${s}%,user_email.ilike.%${s}%,user_name.ilike.%${s}%`,
            );
        }
    }

    query = query.range((page - 1) * size, page * size - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        data: (data ?? []) as ActivityLogEntry[],
        count: count ?? 0,
    };
}
