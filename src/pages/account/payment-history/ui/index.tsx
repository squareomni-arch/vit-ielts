import { AppShell } from "@/widgets/layouts";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { currencyFormat } from "@/shared/lib";
import { createClient } from "~supabase/client";
import { useAuth } from "@/appx/providers";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";

// ─── Constants ───────────────────────────────────────────────
const ORDER_TTL_MINUTES = 60;

// ─── Helpers ─────────────────────────────────────────────────

/** Badge tone → token-based classes (no magic colors) */
type BadgeTone = "teal" | "red" | "gray" | "amber";

const BADGE_TONE: Record<BadgeTone, string> = {
  teal: "bg-brand-tint text-accent-teal",
  red: "bg-surface-blush text-danger",
  gray: "bg-surface-app text-ink-muted",
  amber: "bg-surface-blush text-accent-orange",
};

/** Check if an order is still within the payment window */
const isOrderPayable = (order: any): boolean => {
  if (order.status !== "pending") return false;
  const ageMs = Date.now() - new Date(order.created_at).getTime();
  return ageMs < ORDER_TTL_MINUTES * 60 * 1000;
};

/** Get remaining seconds before an order expires */
const getTimeRemaining = (createdAt: string): number => {
  const expiresAt = new Date(createdAt).getTime() + ORDER_TTL_MINUTES * 60 * 1000;
  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
};

/** Format seconds to "mm:ss" */
const formatCountdown = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

/** Compute status display */
const getStatusDisplay = (
  order: any,
): { text: string; tone: BadgeTone; showContinue: boolean } => {
  switch (order.status) {
    case "completed":
      return { text: "Thành công", tone: "teal", showContinue: false };
    case "cancelled":
      return { text: "Đã hủy", tone: "red", showContinue: false };
    case "expired":
      return { text: "Hết hạn", tone: "gray", showContinue: false };
    case "pending":
      if (isOrderPayable(order)) {
        return { text: "Chờ thanh toán", tone: "amber", showContinue: true };
      }
      // Pending but past TTL (cron hasn't run yet)
      return { text: "Sắp hết hạn", tone: "amber", showContinue: false };
    default:
      return { text: order.status, tone: "gray", showContinue: false };
  }
};

// Generate order ID from paymentDate
const generateOrderId = (paymentDate: string, index: number): string => {
  const hash = paymentDate
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#${(hash + index).toString().slice(-4)}`;
};

// ─── Status badge ────────────────────────────────────────────
const StatusBadge = ({ text, tone }: { text: string; tone: BadgeTone }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-caption-bold whitespace-nowrap ${BADGE_TONE[tone]}`}
  >
    {text}
  </span>
);

// ─── Countdown Component ─────────────────────────────────────
const Countdown = ({ createdAt }: { createdAt: string }) => {
  const [remaining, setRemaining] = useState(() => getTimeRemaining(createdAt));

  useEffect(() => {
    if (remaining <= 0) return;
    const interval = setInterval(() => {
      const next = getTimeRemaining(createdAt);
      setRemaining(next);
      if (next <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt, remaining]);

  if (remaining <= 0) return null;

  const isUrgent = remaining < 300; // < 5 minutes

  return (
    <span className={`text-caption-bold ${isUrgent ? "text-danger" : "text-ink-muted"}`}>
      {formatCountdown(remaining)} còn lại
    </span>
  );
};

// ─── Loading skeleton ────────────────────────────────────────
const LoadingRows = () => (
  <div className="divide-y divide-border-hairline">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-5">
        <div className="h-4 w-16 rounded bg-surface-app animate-pulse" />
        <div className="h-4 flex-1 rounded bg-surface-app animate-pulse" />
        <div className="h-4 w-24 rounded bg-surface-app animate-pulse" />
        <div className="h-4 w-20 rounded bg-surface-app animate-pulse" />
        <div className="h-6 w-24 rounded-full bg-surface-app animate-pulse" />
      </div>
    ))}
  </div>
);

// ─── Empty state ─────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center text-center px-6 py-16">
    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-blush">
      <span className="material-symbols-rounded text-[32px] text-ink-muted" aria-hidden="true">
        receipt_long
      </span>
    </div>
    <h2 className="font-display text-heading-2 text-ink-900 mb-2">
      Chưa có đơn hàng nào
    </h2>
    <p className="text-body-s text-ink-muted max-w-sm mb-6">
      Khi bạn đăng ký gói Pro, các đơn hàng và trạng thái thanh toán sẽ hiển thị tại đây.
    </p>
    <Link
      href={ROUTES.SUBSCRIPTION}
      className="inline-flex items-center justify-center rounded-full bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m px-8 py-3.5 transition-colors"
    >
      Xem các gói đăng ký
    </Link>
  </div>
);

// ─── Row type ────────────────────────────────────────────────
interface OrderRow {
  key: number;
  orderId: string;
  orderIdFull?: string;
  content: string;
  paymentDate: string;
  amount: number;
  status: { text: string; tone: BadgeTone; showContinue: boolean };
  rawOrder: any;
}

/** Status cell — badge (clickable when an order can still be paid) + countdown */
const StatusCell = ({ row }: { row: OrderRow }) => (
  <div className="flex items-center gap-3">
    {row.status.showContinue && row.orderIdFull ? (
      <Link
        href={`${ROUTES.ORDER_RECEIVED}?orderId=${encodeURIComponent(row.orderIdFull)}`}
        className="transition-opacity hover:opacity-80"
        title="Tiếp tục thanh toán"
      >
        <StatusBadge text={row.status.text} tone={row.status.tone} />
      </Link>
    ) : (
      <StatusBadge text={row.status.text} tone={row.status.tone} />
    )}
    {row.status.showContinue && <Countdown createdAt={row.rawOrder.created_at} />}
  </div>
);

// ─── Page Component ──────────────────────────────────────────
export const PagePaymentHistory = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const supabase = createClient();
        const { data: orderData } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        setOrders(orderData || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser?.id]);

  const dataSource: OrderRow[] = useMemo(() => {
    return orders.map((order: any, index: number) => {
      const statusInfo = getStatusDisplay(order);
      return {
        key: index,
        orderId: order.id
          ? `#${String(order.id).slice(-4)}`
          : generateOrderId(order.created_at || "", index),
        orderIdFull: order.order_id,
        content: order.plan_name || order.transfer_content || "Pro Subscription",
        paymentDate: order.created_at,
        amount: order.amount || 0,
        status: statusInfo,
        rawOrder: order,
      };
    });
  }, [orders]);

  return (
    <div className="space-y-8 py-6" data-section="order-history">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-heading-1 text-ink-900 leading-tight">
          Lịch sử đơn hàng
        </h1>
        <p className="text-body-s text-ink-muted mt-1">
          Xem lại các đơn hàng và trạng thái thanh toán của bạn.
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border-hairline bg-surface-card shadow-primary overflow-hidden">
        {loading ? (
          <LoadingRows />
        ) : dataSource.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── Desktop / tablet: table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="bg-surface-blush">
                    {["Mã đơn", "Khóa học", "Ngày", "Số tiền", "Trạng thái"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-caption-bold uppercase tracking-wide text-ink-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataSource.map((row) => (
                    <tr key={row.key} className="border-t border-border-hairline">
                      <td className="px-6 py-5 text-body-s font-semibold text-ink-900 whitespace-nowrap">
                        {row.orderId}
                      </td>
                      <td className="px-6 py-5 text-body-s text-ink-900">{row.content}</td>
                      <td className="px-6 py-5 text-body-s text-ink-muted whitespace-nowrap">
                        {dayjs(row.paymentDate).format("DD/MM/YYYY")}
                      </td>
                      <td className="px-6 py-5 text-body-s font-semibold text-ink-900 whitespace-nowrap">
                        {currencyFormat(row.amount)}
                      </td>
                      <td className="px-6 py-5">
                        <StatusCell row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile: stacked cards ── */}
            <div className="md:hidden divide-y divide-border-hairline">
              {dataSource.map((row) => (
                <div key={row.key} className="px-5 py-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body-m font-semibold text-ink-900 truncate">
                        {row.content}
                      </p>
                      <p className="text-caption-bold text-ink-muted mt-0.5">
                        {row.orderId} · {dayjs(row.paymentDate).format("DD/MM/YYYY")}
                      </p>
                    </div>
                    <span className="text-body-m font-bold text-ink-900 whitespace-nowrap">
                      {currencyFormat(row.amount)}
                    </span>
                  </div>
                  <StatusCell row={row} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

PagePaymentHistory.Layout = AppShell;
