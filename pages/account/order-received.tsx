import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getOrderById } from "~services/order";
import { AppShell } from "@/widgets/layouts";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";

const CopyButton = dynamic(() => import("@/entities/copy-button"), { ssr: false });

interface OrderData {
  orderId: string;
  amount: number;
  createdAt: string;
  paymentMethod: string;
  transferContent: string;
  status: string;
}

interface OrderReceivedPageProps {
  order: OrderData | null;
  error?: string;
}

const OrderReceivedPage = ({ order: initialOrder, error }: OrderReceivedPageProps) => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(initialOrder);
  const [isPaymentSuccessModalOpen, setIsPaymentSuccessModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownSuccessModalRef = useRef(false);

  // Polling để check order status
  useEffect(() => {
    if (!order || order.status === "completed" || order.status === "expired" || order.status === "cancelled" || error) {
      return;
    }

    // Chỉ polling nếu order đang pending
    if (order.status === "pending") {
      setIsPolling(true);

      const pollOrderStatus = async () => {
        try {
          const res = await fetch(`/api/orders/${order.orderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              const newStatus = data.order.orderFields.status;

              // Nếu status chuyển sang completed và chưa hiển thị modal
              if (newStatus === "completed" && !hasShownSuccessModalRef.current) {
                setOrder((prevOrder) => {
                  if (!prevOrder) return prevOrder;
                  return {
                    ...prevOrder,
                    status: "completed",
                  };
                });
                setIsPaymentSuccessModalOpen(true);
                hasShownSuccessModalRef.current = true;
                setIsPolling(false);

                // Dừng polling
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }

                // Cho user thấy state "Đã thanh toán thành công" 1.5s trước
                // khi đẩy về trang profile để họ biết Pro đã được kích hoạt.
                setTimeout(() => {
                  router.push(ROUTES.ACCOUNT.MY_PROFILE);
                }, 1500);
              } else if (newStatus === "expired" || newStatus === "cancelled") {
                // Order expired or cancelled — stop polling and update UI
                setOrder((prevOrder) => {
                  if (!prevOrder) return prevOrder;
                  return { ...prevOrder, status: newStatus };
                });
                setIsPolling(false);
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
              } else if (newStatus !== order.status) {
                // Cập nhật status nếu có thay đổi
                setOrder((prevOrder) => {
                  if (!prevOrder) return prevOrder;
                  return {
                    ...prevOrder,
                    status: newStatus,
                  };
                });
              }
            }
          }
        } catch (error) {
          console.error("Error polling order status:", error);
        }
      };

      // Poll ngay lập tức, sau đó mỗi 5 giây
      pollOrderStatus();
      pollingIntervalRef.current = setInterval(pollOrderStatus, 5000);

      // Cleanup khi component unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [order?.status, order?.orderId, error]);

  // Cleanup polling khi component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  if (error || !order) {
    return (
      <div className="space-y-8 py-6" data-section="order-received-error">
        <div className="mx-auto w-full max-w-[560px] rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-blush">
            <span className="material-symbols-rounded text-[32px] text-danger" aria-hidden="true">
              error
            </span>
          </div>
          <h1 className="font-display text-heading-2 text-ink-900 mb-3">
            Không tìm thấy đơn hàng
          </h1>
          <p className="text-body-s text-ink-muted mb-8">
            {error || "Đơn hàng không tồn tại hoặc đã bị xóa."}
          </p>
          <Link
            href={ROUTES.SUBSCRIPTION}
            className="inline-flex items-center justify-center rounded-full bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m px-8 py-3.5 transition-colors"
          >
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // ── Expired / Cancelled State ──
  if (order.status === "expired" || order.status === "cancelled") {
    const isExpired = order.status === "expired";
    return (
      <div className="space-y-8 py-6" data-section="order-received-closed">
        <div className="mx-auto w-full max-w-[560px] space-y-6">
          {/* Status card */}
          <div className="rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-blush">
              <span
                className={`material-symbols-rounded text-[32px] ${isExpired ? "text-ink-muted" : "text-danger"}`}
                aria-hidden="true"
              >
                {isExpired ? "schedule" : "cancel"}
              </span>
            </div>
            <h1 className="font-display text-heading-2 text-ink-900 mb-3">
              {isExpired ? "Đơn hàng đã hết hạn" : "Đơn hàng đã bị hủy"}
            </h1>
            <p className="text-body-s text-ink-muted leading-relaxed">
              {isExpired
                ? "Đơn hàng đã quá thời gian thanh toán (60 phút). Nếu bạn đã chuyển khoản, vui lòng liên hệ hotline để được hỗ trợ."
                : "Đơn hàng đã bị hủy. Vui lòng tạo đơn hàng mới nếu bạn muốn tiếp tục."}
            </p>
          </div>

          {/* Order summary */}
          <div className="rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="MÃ ĐƠN HÀNG" value={`#${order.orderId}`} />
              <InfoRow label="SỐ TIỀN" value={formatPrice(order.amount).replace("đ", "₫")} />
              <InfoRow
                label="TRẠNG THÁI"
                value={isExpired ? "Đã hết hạn" : "Đã hủy"}
                className="md:col-span-2"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="flex items-center justify-center rounded-full bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m px-6 py-3.5 transition-colors"
            >
              Đặt đơn hàng mới
            </Link>
            {isExpired && (
              <a
                href="tel:0927090848"
                className="flex items-center justify-center rounded-full border border-border-hairline bg-surface-card hover:bg-brand-tint text-ink-900 font-display font-bold text-body-m px-6 py-3.5 transition-colors"
              >
                Liên hệ hỗ trợ: 0927090848
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayOrderId = `#${order.orderId}`;
  const displayAmount = formatPrice(order.amount);
  const displayDate = dayjs(order.createdAt).format("DD [Tháng] MM, YYYY");
  const displayNote = order.transferContent;

  // ── Completed / Success State (SSR-loaded or post-redirect) ──
  // Note: the polling path shows a modal + auto-redirects to MY_PROFILE after 1.5s,
  // so this card is primarily seen when the order arrives already completed via SSR.
  if (order.status === "completed") {
    return (
      <div className="space-y-8 py-6" data-section="order-received-success">
        <div className="mx-auto w-full max-w-[480px] rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-10 flex flex-col items-center text-center">

          {/* Brand check circle */}
          <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center mb-6 shrink-0">
            <span className="material-symbols-rounded text-[44px] text-ink-900" aria-hidden="true">
              check
            </span>
          </div>

          {/* Eyebrow */}
          <p className="text-caption-bold uppercase tracking-widest text-accent-teal mb-2">
            PAYMENT SUCCESSFUL
          </p>

          {/* Heading */}
          <h1 className="font-display text-heading-1 text-ink-900 leading-tight mb-3">
            You&apos;re Pro. Let&apos;s go.
          </h1>

          {/* Subtitle */}
          <p className="text-body-s text-ink-muted max-w-sm mb-8">
            Subscription đã kích hoạt — 920+ mock tests đang chờ bạn. Biên lai đã được gửi đến email của bạn.
          </p>

          {/* Summary box */}
          <div className="w-full bg-surface-blush rounded-xl border border-border-hairline overflow-hidden mb-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-hairline">
              <span className="text-body-s text-ink-muted">Gói đăng ký</span>
              <span className="text-body-s font-semibold text-ink-900">{displayOrderId}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-hairline">
              <span className="text-body-s text-ink-muted">Ngày thanh toán</span>
              <span className="text-body-s font-semibold text-ink-900">{displayDate}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-body-s font-bold text-ink-900">Total paid</span>
              <span className="text-body-s font-bold text-ink-900">{displayAmount}</span>
            </div>
          </div>

          {/* Primary CTA — dark pill */}
          <Link
            href={ROUTES.ACCOUNT.DASHBOARD}
            className="w-full flex items-center justify-center rounded-full bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m py-4 transition-colors mb-3"
          >
            Start practising
          </Link>

          {/* Secondary CTA — outline pill */}
          <Link
            href={ROUTES.ACCOUNT.ORDER_HISTORY}
            className="w-full flex items-center justify-center rounded-full border border-border-hairline bg-surface-card hover:bg-brand-tint text-ink-900 font-display font-bold text-body-m py-4 transition-colors"
          >
            View receipt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6" data-section="order-received-pending">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-heading-1 text-ink-900 leading-tight">
          Hoàn tất thanh toán
        </h1>
        <p className="text-body-s text-ink-muted mt-1">
          Đơn hàng đã được tạo — chuyển khoản để kích hoạt Pro.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT CARD: Bank transfer instructions ── */}
        <div className="flex-1 min-w-0 rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 space-y-6">
          <div>
            <h2 className="font-display text-heading-2 text-ink-900">
              Chuyển khoản để thanh toán
            </h2>
            <p className="text-body-s text-ink-muted mt-1">
              Quét mã QR hoặc chuyển khoản thủ công theo thông tin bên dưới.
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoRow label="TÊN TÀI KHOẢN" value="NGUYEN TRUNG KIEN" />
            <InfoRow label="SỐ TÀI KHOẢN" value="0363500192" />
            <InfoRow label="NGÂN HÀNG" value="Ngân hàng TMCP Quân Đội (MB Bank)" />
            <InfoRow label="SỐ TIỀN" value={displayAmount.replace("đ", "₫")} />
            <InfoRow label="NỘI DUNG CHUYỂN KHOẢN" value={displayNote} className="md:col-span-2" />
            <InfoRow label="TRẠNG THÁI" value="Chờ thanh toán" className="md:col-span-2" />
          </div>

          {/* Warning banner */}
          <div className="rounded-xl border border-border-hairline bg-surface-blush px-4 py-3 flex items-start gap-3">
            <span className="material-symbols-rounded text-[20px] text-accent-orange shrink-0 mt-0.5" aria-hidden="true">
              warning
            </span>
            <p className="text-body-s font-semibold text-ink-900">
              Vui lòng nhập chính xác nội dung chuyển khoản để hệ thống kiểm tra và kích hoạt tự động.
            </p>
          </div>

          {/* Status + support */}
          <div className="border-t border-border-hairline pt-6 space-y-4">
            <p className="text-body-s text-ink-muted leading-relaxed">
              Sau khi hoàn tất chuyển khoản, vui lòng{" "}
              <span className="font-semibold text-ink-900">không tắt trình duyệt</span>{" "}
              cho đến khi nhận được kết quả giao dịch trên website. Xin cảm ơn!
            </p>

            <div className="flex items-center gap-2 text-body-s font-bold">
              <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
              <span className="text-accent-teal">
                {isPolling ? "Đang kiểm tra thanh toán..." : "Đang chờ chuyển khoản"}
              </span>
            </div>

            <a
              href="tel:0927090848"
              className="inline-flex items-center gap-2 rounded-full border border-border-hairline bg-surface-card hover:bg-brand-tint text-ink-900 font-semibold text-body-s px-5 py-2.5 transition-colors"
            >
              <span className="material-symbols-rounded text-[18px]" aria-hidden="true">call</span>
              Báo cáo sự cố: 0927090848
            </a>
          </div>
        </div>

        {/* ── RIGHT CARD: QR + summary + actions ── */}
        <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 space-y-6">
          <h2 className="font-display text-heading-2 text-ink-900">
            Quét mã QR
          </h2>

          {/* QR code */}
          <div className="flex flex-col items-center">
            <div className="w-[200px] h-[200px] rounded-xl border border-border-hairline bg-surface-card p-2">
              <img
                src={`https://qr.sepay.vn/img?acc=0363500192&bank=MB&amount=${order.amount}&des=${encodeURIComponent(order.orderId)}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-5 w-full flex flex-col items-center">
              <CopyButton text={displayNote} />
              <p className="text-caption-bold text-ink-muted mt-3">
                Nhấn để sao chép nội dung chuyển khoản
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="border-t border-border-hairline pt-6 space-y-3 text-body-s">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-muted shrink-0">Mã đơn</span>
              <span className="font-semibold text-ink-900 text-right break-all">{displayOrderId}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-muted shrink-0">Thời gian</span>
              <span className="font-semibold text-ink-900 text-right">{displayDate}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-muted shrink-0">Hình thức</span>
              <span className="font-semibold text-ink-900 text-right">Ngân hàng MB Bank</span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border-hairline pt-5 flex items-baseline justify-between">
            <span className="font-display text-title-m text-ink-900">Thanh toán</span>
            <span className="font-display text-heading-2 text-ink-900">{displayAmount}</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={ROUTES.ACCOUNT.ORDER_HISTORY}
              className="w-full flex items-center justify-center rounded-full bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m py-4 transition-colors"
            >
              Xem lịch sử đơn hàng
            </Link>
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="w-full flex items-center justify-center rounded-full border border-border-hairline bg-surface-card hover:bg-brand-tint text-ink-900 font-display font-bold text-body-m py-4 transition-colors"
            >
              Trở về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, className = "" }: { label: string; value: string; className?: string; }) => (
  <div className={`rounded-lg border border-border-hairline bg-surface-card px-4 py-3 flex flex-col justify-center ${className}`}>
    <div className="text-caption-bold uppercase text-ink-muted mb-1">{label}</div>
    <div className="text-body-s font-semibold text-ink-900 break-all">{value}</div>
  </div>
);

OrderReceivedPage.Layout = AppShell;

export default OrderReceivedPage;

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const { orderId } = context.query;

    if (!orderId || typeof orderId !== "string") {
      return {
        props: {
          order: null,
          error: "Order ID is required",
        },
      };
    }

    try {
      if (orderId === "mock") {
        return {
          props: {
            order: {
              orderId: "17742607371538227",
              amount: 600000,
              createdAt: new Date().toISOString(),
              paymentMethod: "bank_transfer",
              transferContent: "Vit IELTS 17742607371538227",
              status: "pending",
            },
          },
        };
      }

      const { supabaseAdmin } = await import("~supabase/admin");
      const orderRow = await getOrderById(supabaseAdmin, orderId);

      if (!orderRow) {
        return {
          props: {
            order: null,
            error: "Order not found",
          },
        };
      }

      return {
        props: {
          order: {
            orderId: orderRow.order_id,
            amount: orderRow.amount,
            createdAt: orderRow.created_at,
            paymentMethod: orderRow.payment_method ?? "bank_transfer",
            transferContent: orderRow.transfer_content ?? orderRow.order_id,
            status: orderRow.status,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching order:", error);
      return {
        props: {
          order: null,
          error: "Failed to fetch order information",
        },
      };
    }
  }
);

