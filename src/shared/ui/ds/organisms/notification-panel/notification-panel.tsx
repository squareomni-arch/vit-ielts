/**
 * NotificationPanel — dropdown shown from the header bell.
 *
 * Presentational only: receives the user's notifications and callbacks.
 * Data + polling live in `useNotifications` (src/shared/lib/use-notifications.ts).
 * Icon chips mirror the Toast molecule's type → color mapping.
 */

import { twMerge } from 'tailwind-merge';
import type { Notification, NotificationType } from '~services/types/database';

export type NotificationPanelProps = {
  notifications: Notification[];
  loading?: boolean;
  onItemClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  className?: string;
};

const CHIP_BG: Record<NotificationType, string> = {
  success: 'bg-[var(--color-accent-teal)]',
  error:   'bg-[var(--color-danger)]',
  warning: 'bg-[var(--color-accent-orange)]',
  info:    'bg-[var(--color-accent-blue)]',
};

const ICON_SRC: Record<NotificationType, string> = {
  success: '/assets/icons/Check.svg',
  error:   '/assets/icons/X.svg',
  warning: '/assets/icons/Warning.svg',
  info:    '/assets/icons/Bell.svg',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export const NotificationPanel = ({
  notifications,
  loading = false,
  onItemClick,
  onMarkAllRead,
  className,
}: NotificationPanelProps) => {
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div
      role="menu"
      className={twMerge(
        'w-[384px] max-h-[480px] flex flex-col bg-white rounded-2xl',
        'border border-black/10 shadow-[0px_8px_12px_rgba(15,23,41,0.10)] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06]">
        <p className="text-[15px] font-semibold font-inter text-[var(--color-ink-900)]">
          Thông báo
        </p>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[13px] font-semibold font-inter text-[var(--color-accent-blue)] hover:underline"
          >
            Đánh dấu đã đọc hết
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] font-inter text-[var(--color-ink-muted)]">
            Đang tải…
          </p>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 flex flex-col items-center gap-2">
            <span className="material-symbols-rounded text-[32px] text-[var(--color-ink-muted)]">
              notifications_off
            </span>
            <p className="text-[13px] font-inter text-[var(--color-ink-muted)]">
              Chưa có thông báo nào
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onItemClick(n)}
              className={twMerge(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-[var(--color-surface-app)]',
                !n.is_read && 'bg-[var(--color-brand-tint)]/40',
              )}
            >
              <div
                className={twMerge(
                  'flex items-center justify-center shrink-0 w-[34px] h-[34px] rounded-[10px] overflow-hidden',
                  CHIP_BG[n.type],
                )}
              >
                <img src={ICON_SRC[n.type]} alt="" className="w-[20px] h-[20px]" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                <p className="text-[14px] font-semibold font-inter text-[var(--color-ink-900)] leading-[19px]">
                  {n.title}
                </p>
                {n.message && (
                  <p className="text-[13px] font-inter text-[var(--color-ink-muted)] leading-[18px]">
                    {n.message}
                  </p>
                )}
                <p className="text-[12px] font-inter text-[var(--color-ink-muted)] pt-[2px]">
                  {timeAgo(n.created_at)}
                </p>
              </div>
              {!n.is_read && (
                <span className="shrink-0 mt-[6px] w-[8px] h-[8px] rounded-full bg-[var(--color-danger)]" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
