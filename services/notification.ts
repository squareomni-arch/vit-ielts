/**
 * Notification Service — per-user in-app notifications
 *
 * Events across the app create notifications via `createNotification` (using the
 * admin client). The notification bell reads them via `getUserNotifications` /
 * `getUnreadCount`, and marks them read via `markNotificationRead` / `markAllRead`.
 *
 * Preference-gated categories (`classroom`, `community`) check the user's
 * `users.settings.notifications` toggles before creating a row. Transactional
 * categories (`order`, `test`) are always created.
 *
 * @see services/types/database.ts (Notification type)
 * @see supabase/migrations/034_user_notifications.sql
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type {
    Notification,
    NotificationCategory,
    NotificationType,
} from "./types/database";
import type { UserSettings } from "./types/database";

type CreateNotificationInput = {
    userId: string;
    title: string;
    message?: string | null;
    type?: NotificationType;
    category?: NotificationCategory;
    entityId?: string | null;
    link?: string | null;
};

/**
 * Maps a preference-gated category to the `users.settings.notifications` key
 * that controls it. Categories not listed here are always sent (transactional).
 */
const CATEGORY_PREFERENCE: Partial<
    Record<NotificationCategory, keyof NonNullable<UserSettings["notifications"]>>
> = {
    classroom: "studyReminders",
    community: "communityReplies",
};

/**
 * Returns true if the user opted out of the given category. Defaults to allowing
 * delivery when no preference is stored or on lookup failure (fail-open).
 */
async function isCategoryMuted(
    supabase: SupabaseClient,
    userId: string,
    category: NotificationCategory,
): Promise<boolean> {
    const prefKey = CATEGORY_PREFERENCE[category];
    if (!prefKey) return false; // transactional — always send

    const { data, error } = await supabase
        .from("users")
        .select("settings")
        .eq("id", userId)
        .single();

    if (error || !data) return false;

    const settings = (data.settings ?? {}) as UserSettings;
    const value = settings.notifications?.[prefKey];
    // Only mute when explicitly disabled.
    return value === false;
}

/**
 * Inserts a notification for a user. Pass the admin client (service_role) — RLS
 * does not grant INSERT to authenticated. Returns null when the user has muted
 * the category.
 *
 * @param supabase - Supabase admin client (supabaseAdmin)
 */
export async function createNotification(
    supabase: SupabaseClient,
    input: CreateNotificationInput,
): Promise<Notification | null> {
    if (input.category && (await isCategoryMuted(supabase, input.userId, input.category))) {
        return null;
    }

    const { data, error } = await supabase
        .from("notifications")
        .insert({
            user_id: input.userId,
            title: input.title,
            message: input.message ?? null,
            type: input.type ?? "info",
            category: input.category ?? null,
            entity_id: input.entityId ?? null,
            link: input.link ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Notification;
}

/**
 * Lists a user's notifications, newest first.
 */
export async function getUserNotifications(
    supabase: SupabaseClient,
    userId: string,
    { limit = 20 }: { limit?: number } = {},
): Promise<Notification[]> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data ?? []) as Notification[];
}

/**
 * Counts a user's unread notifications.
 */
export async function getUnreadCount(
    supabase: SupabaseClient,
    userId: string,
): Promise<number> {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) throw error;
    return count ?? 0;
}

/**
 * Marks a single notification read. Always scoped to the owning user.
 */
export async function markNotificationRead(
    supabase: SupabaseClient,
    userId: string,
    notificationId: string,
): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

    if (error) throw error;
}

/**
 * Marks all of a user's unread notifications read.
 */
export async function markAllRead(
    supabase: SupabaseClient,
    userId: string,
): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

    if (error) throw error;
}
