import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MyProfileLayout } from "@/widgets/layouts";
import {
  calculatePrice,
  formatPrice,
  SkillType,
} from "@/pages/subscription/ui/subscription-plans/pricing";
import { ROUTES } from "@/shared/routes";
import { CheckCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/appx/providers/auth-provider";
import { toast } from "react-toastify";
import Link from "next/link";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";

const CheckoutPage = () => {
  const router = useRouter();
  const { type, months, skill } = router.query;
  const { currentUser } = useAuth();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [config, setConfig] = useState<CoursePackagesConfig | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // 1. Fetch config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/subscription/course-packages");
        if (res.ok) {
          const data = (await res.json()) as CoursePackagesConfig;
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch config:", error);
      }
    };
    fetchConfig();
  }, []);

  // 2. Tính toán selection an toàn với Optional Chaining
  const selection = useMemo(() => {
    const pkgType = type === "single" ? "single" : "combo";
    const duration = Number(months) || (pkgType === "single" ? 2 : 3);
    const skillType = (skill as SkillType) || "listening";

    const basePrice =
      pkgType === "combo" ? config?.combo?.basePrice : config?.single?.basePrice;
    const monthlyIncrement =
      pkgType === "combo"
        ? (config?.combo?.monthlyIncrementPrice ?? 100000)
        : (config?.single?.monthlyIncrementPrice ?? 100000);
    const priceTable =
      pkgType === "combo"
        ? config?.combo?.plans.reduce<Record<number, number>>(
            (acc, plan) => {
              acc[plan.months] = plan.price;
              return acc;
            },
            {}
          )
        : config?.single?.plans.reduce<Record<number, number>>(
            (acc, plan) => {
              acc[plan.months] = plan.price;
              return acc;
            },
            {}
          );
    const price = calculatePrice(
      pkgType,
      duration,
      basePrice,
      monthlyIncrement,
      priceTable
    );

    return {
      pkgType,
      duration,
      skillType,
      price,
    };
  }, [type, months, skill, config]);

  const finalPrice = useMemo(() => {
    if (!selection.price) return 0;
    const discount = appliedCoupon?.discountAmount || 0;
    return Math.max(0, selection.price - discount);
  }, [selection.price, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });

      const data = await res.json();

      if (data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        toast.success(data.message || "Áp dụng mã giảm giá thành công");
      } else {
        setAppliedCoupon(null);
        toast.error(data.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi kiểm tra mã giảm giá");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const productName =
    selection.pkgType === "combo"
      ? "Combo (Listening + Reading)"
      : `Single Pack - ${selection.skillType}`;

  // 3. Hàm xử lý Checkout
  const handleCheckout = async () => {
    if (!currentUser?.id) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      return;
    }

    if (!selection.price) {
      toast.error("Giá không hợp lệ");
      return;
    }

    setIsCreatingOrder(true);

    try {
      
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType: selection.pkgType,
          duration: selection.duration,
          skillType: selection.skillType,
          couponCode: appliedCoupon?.code || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      const orderId = data.order.orderId;
      router.push(`${ROUTES.ORDER_RECEIVED}?orderId=${encodeURIComponent(orderId)}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo đơn hàng");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // 4. GUARD CLAUSE: Tránh render lỗi khi Vercel Build (Prerendering)
  // Nếu config chưa tải xong hoặc router chưa sẵn sàng, trả về loading
  if (!config || !router.isReady) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-section="checkout-main">
      {/* Target: Success Alert */}
      <div className="flex items-center gap-2 rounded-xl bg-[#EDF7ED] px-5 py-3 text-[#1E4620]">
        <CheckCircle className="h-5 w-5 text-[#4CAF50]" />
        <p className="text-sm font-medium">
          {productName} • {selection.duration} month
          {selection.duration > 1 ? "s" : ""} added to your cart.
        </p>
      </div>

      <h2 className="text-[24px] font-bold text-[#2D3142] tracking-tight">Cart</h2>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* === Left: Cart Items Table === */}
        <div className="flex-1 rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] w-full">
          {/* Table Header */}
          <div className="grid grid-cols-4 bg-[#F8F9FA] px-6 py-4 text-sm font-bold text-[#2D3142] border-b border-gray-100">
            <div className="col-span-3">Subscription Plan</div>
            <div className="text-right">Total</div>
          </div>

          {/* Table Body */}
          <div className="grid grid-cols-4 px-6 py-5 items-center bg-white group">
            <div className="col-span-3 flex items-center gap-4">
              <button
                type="button"
                className="text-primary-500 hover:text-primary-300 transition-colors flex-shrink-0"
                aria-label="Remove item"
                onClick={() => router.push(ROUTES.SUBSCRIPTION)}
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <div className="h-16 w-16 rounded-xl border border-gray-100 bg-[#FAF7EB] flex items-center justify-center text-xs font-bold text-[#2D3142] flex-shrink-0" style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)"}}>
                {selection.pkgType === "combo" ? "COMBO" : "SINGLE"}
              </div>

              <div className="min-w-0">
                <p className="text-base font-bold text-[#2D3142]">
                  {selection.pkgType === "combo" ? "Standard Plan" : "Single Pack"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  {productName} • {selection.duration} month
                  {selection.duration > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="text-right text-base font-bold text-[#2D3142]">
              {formatPrice(selection.price)}
            </div>
          </div>
        </div>

        {/* === Right: Order Summary === */}
        <div className="w-full lg:w-[360px] flex-shrink-0 rounded-2xl border border-gray-100 bg-[#F8F9FA] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[#2D3142]">
          <h3 className="text-lg font-bold mb-5">Your order</h3>

          {/* Coupon Code section */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-bold block">Mã giảm giá</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-white border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-[#27AE60]">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Giảm {formatPrice(appliedCoupon.discountAmount)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-primary-500 hover:text-primary-300 text-sm font-bold"
                >
                  Xóa
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá"
                  className="flex-1 w-full min-w-0 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleApplyCoupon();
                    }
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="px-5 py-2.5 rounded-lg bg-[#2D3142] hover:bg-black text-white text-sm font-bold transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>

          {/* Financials */}
          <div className="space-y-4 text-sm mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sub-total</span>
              <span className="font-medium text-[#2D3142]">{formatPrice(selection.price)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-[#27AE60]">
                <span>Giảm giá ({appliedCoupon.code})</span>
                <span className="font-bold">-{formatPrice(appliedCoupon.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-[#2D3142]">0</span>
            </div>
            
            <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
              <span className="text-base font-bold">Total</span>
              <span className="text-lg font-bold">{formatPrice(finalPrice)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCreatingOrder}
            className="w-full py-3.5 rounded-lg bg-tertiary-500 hover:bg-[#E08A40] text-white font-bold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isCreatingOrder ? "Đang xử lý..." : "Checkout"}
          </button>

          <div className="text-center">
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              View Subscription Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

CheckoutPage.Layout = MyProfileLayout;

// Disable static generation để tránh lỗi prerender
// Trang này cần client-side data (router query, auth, config)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default CheckoutPage;