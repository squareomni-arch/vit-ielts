import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getOrderById } from "~services/order";
import { MyProfileLayout } from "@/widgets/layouts";
import Link from "next/link";
import { ROUTES } from "@/shared/routes";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";
import dayjs from "dayjs";
import { CheckCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { Modal, Button } from "antd";
import { useRouter } from "next/router";

const CopyButton = dynamic(() => import("./copy-button"), { ssr: false });

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
    if (!order || order.status === "completed" || error) {
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
      <div className="flex justify-center min-h-[60vh] items-center px-4">
        <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl border border-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 mb-4">
              Không tìm thấy đơn hàng
            </h1>
            <p className="text-gray-600 mb-8">
              {error || "Đơn hàng không tồn tại hoặc đã bị xóa."}
            </p>
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold transition shadow-md hover:shadow-lg"
            >
              Trở về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayOrderId = `#${order.orderId}`;
  const displayAmount = formatPrice(order.amount);
  const displayDate = dayjs(order.createdAt).format("DD [Tháng] MM, YYYY");
  const displayMethod = order.paymentMethod;
  const displayNote = order.transferContent;

  return (
    <div className="flex flex-col items-center pb-12 w-full max-w-[800px] mx-auto space-y-6">
      {/* 1. Header block */}
      <div className="text-center pt-8 pb-4">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#EDF7ED] rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-[#4CAF50]" />
          </div>
        </div>
        <h1 className="text-[28px] font-bold text-[#2D3142] mb-3">
          Đơn hàng của bạn đã được đặt thành công!
        </h1>
        <p className="text-[13px] text-gray-500 max-w-[600px] mx-auto leading-relaxed">
          Vui lòng <span className="font-bold text-[#2D3142]">không tắt trình duyệt</span> cho đến khi nhận được <span className="font-bold text-[#2D3142]">kết quả giao dịch</span> trên website. Hệ thống sẽ kiểm tra và xử lý sau vào vài phút...
        </p>
      </div>

      {/* 2. Bank Transfer Card */}
      <div className="w-full bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden border border-gray-100 flex flex-col">
        {/* Red Header */}
        <div className="bg-primary-500 text-white font-bold text-sm px-6 py-3.5 text-center uppercase tracking-wide">
          CHUYỂN KHOẢN ĐỂ THANH TOÁN
        </div>

        <div className="p-6">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <InfoRow label="TÊN TÀI KHOẢN" value="TRAN PHAN TIEN PHAT" />
            <InfoRow label="SỐ TÀI KHOẢN" value="2447967" />
            <InfoRow label="NGÂN HÀNG" value="Thương Mại Cổ Phần Á Châu (ACB)" />
            <InfoRow label="SỐ TIỀN" value={displayAmount.replace("đ", "₫")} />
            <InfoRow label="NỘI DUNG CHUYỂN KHOẢN" value={displayNote} className="md:col-span-2" />
            <InfoRow
              label="TRẠNG THÁI"
              value={order.status === "completed" ? "Đã thanh toán thành công" : "Chờ thanh toán"}
              className="md:col-span-2 font-black"
            />
          </div>

          {/* Warning Banner */}
          <div className="bg-[#FFF9E6] rounded-lg px-4 py-3 mb-8 text-center border border-[#FDE68A]">
            <p className="text-[#D97706] font-bold text-xs">
              ⚠️ VUI LÒNG NHẬP CHÍNH XÁC NỘI DUNG CHUYỂN KHOẢN ĐỂ HỆ THỐNG KIỂM TRA VÀ KÍCH HOẠT TỰ ĐỘNG
            </p>
          </div>

          {/* QR & Copy Section */}
          <div className="flex flex-col items-center pb-8 border-b border-gray-100">
            <div className="w-[200px] h-[200px] bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-6">
              <img
                src={`https://qr.sepay.vn/img?acc=2447967&bank=ACB&amount=${order.amount}&des=${encodeURIComponent(order.orderId)}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            
            <CopyButton text={displayNote} />
            <p className="text-[11px] text-gray-400 mt-3 italic">Nhấn để sao chép nội dung chuyển khoản</p>
          </div>

          {/* Footer Check Status */}
          <div className="pt-6 text-center space-y-4">
            <p className="text-[13px] text-gray-500 max-w-[480px] mx-auto leading-relaxed">
              Sau khi hoàn tất chuyển khoản, vui lòng <span className="font-bold text-[#2D3142]">không tắt trình duyệt</span> cho đến khi nhận được kết quả giao dịch trên website. Xin cảm ơn!
            </p>
            
            <div className="flex items-center justify-center gap-2 text-sm font-bold">
              {order.status === "completed" ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600">Đã thanh toán thành công</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-[#27AE60] rounded-full animate-pulse"></div>
                  <span className="text-[#27AE60]">
                    {isPolling ? "Đang kiểm tra thanh toán..." : "Đang chờ chuyển khoản"}
                  </span>
                </>
              )}
            </div>

            <a
              href="tel:0927090848"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F8F9FA] hover:bg-gray-100 text-[#2D3142] font-semibold transition text-xs border border-gray-100"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              Báo cáo sự cố: 0927090848
            </a>
          </div>
        </div>
      </div>

      {/* 3. Order Summary Footer */}
      <div className="w-full text-center mb-2">
        <p className="text-[13px] text-gray-500 mb-4">Cảm ơn bạn. Đơn hàng của bạn đã được nhận.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryBox label="MÃ ĐƠN" value={`#IELTS PRED ${order.orderId?.substring(0,6) || ''}`} />
          <SummaryBox label="THỜI GIAN" value={dayjs(order.createdAt).format("DD Tháng MM, YYYY")} />
          <SummaryBox label="THANH TOÁN" value={displayAmount} />
          <SummaryBox label="HÌNH THỨC" value="Ngân hàng ACB (Ngân hàng Á Châu)" />
        </div>
      </div>

      {/* 4. Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <Link
          href={ROUTES.SUBSCRIPTION}
          className="px-6 py-2.5 rounded-lg bg-tertiary-500 hover:bg-[#E08A40] text-white font-bold text-sm transition-colors"
        >
          Trở về trang chủ
        </Link>
        <Link
          href={ROUTES.ACCOUNT.ORDER_HISTORY}
          className="px-6 py-2.5 rounded-lg border border-gray-200 bg-white text-[#2D3142] hover:bg-gray-50 font-bold text-sm transition-colors"
        >
          Xem lịch sử đơn hàng
        </Link>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, className = "" }: { label: string; value: string; className?: string; }) => (
  <div className={`bg-[#F8F9FA] rounded-xl p-3 border border-gray-100 flex flex-col justify-center ${className}`}>
    <div className="text-[10px] text-gray-500 font-bold mb-1 tracking-wide">{label}</div>
    <div className="text-sm font-bold text-[#2D3142] break-all">{value}</div>
  </div>
);

const SummaryBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-[#F8F9FA] rounded-xl border border-gray-100 p-4 text-center">
    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1 tracking-wide">{label}</p>
    <p className="text-xs font-bold text-[#2D3142] break-words">{value}</p>
  </div>
);

OrderReceivedPage.Layout = MyProfileLayout;

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
              transferContent: "IELTS PREDICTION 17742607371538227",
              status: "pending",
            },
          },
        };
      }

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

