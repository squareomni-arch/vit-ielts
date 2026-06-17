import { useCallback, useEffect, useRef, useState } from "react";
import type { Notification } from "~services/types/database";

const POLL_INTERVAL_MS = 60_000;

type NotificationsApiResponse = {
  success: boolean;
  data?: Notification[];
  unreadCount?: number;
};

/**
 * Client hook for the in-app notification bell.
 *
 * Fetches the current user's notifications on mount and polls lightly
 * (~60s) to keep the unread badge fresh. No realtime — see
 * pages/api/notifications. Mutations (mark read) optimistically update
 * local state, then persist via the API.
 *
 * @param enabled - only fetch/poll when signed in
 */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json: NotificationsApiResponse = await res.json();
      if (json.success) {
        setNotifications(json.data ?? []);
        setUnreadCount(json.unreadCount ?? 0);
      }
    } catch {
      // Silent — badge simply stays at its last known value.
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [enabled]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.is_read ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: "PUT" });
    } catch {
      // Best-effort; next refresh reconciles.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications?all=true", { method: "PUT" });
    } catch {
      // Best-effort; next refresh reconciles.
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
