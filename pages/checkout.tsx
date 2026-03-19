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
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800">
        <CheckCircle className="h-5 w-5" />
        <p className="text-sm font-semibold">
          {productName} • {selection.duration} month
          {selection.duration > 1 ? "s" : ""} added to your cart.
        </p>
      </div>

      <h2 className="text-3xl font-black text-gray-900">Cart</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
            <div className="col-span-3">Subscription Plan</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="grid grid-cols-5 items-center px-4 py-4 border-t border-gray-100">
            <div className="col-span-3 flex items-center gap-3">
              <button
                type="button"
                className="text-red-500 hover:text-red-600"
                aria-label="Remove item"
                onClick={() => router.push(ROUTES.SUBSCRIPTION)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="h-14 w-14 rounded-lg border border-gray-200 bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-700">
                {selection.pkgType === "combo" ? "COMBO" : "SINGLE"}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {selection.pkgType === "combo" ? "Standard Plan" : "Single Pack"}
                </p>
                <p className="text-sm text-gray-600">
                  {productName} · {selection.duration} month
                  {selection.duration > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="col-span-2 text-right text-base font-semibold text-gray-900">
              {formatPrice(selection.price)}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Your order</h3>

          <div className="space-y-3">
            <label className="text-sm text-gray-700 font-medium">Mã giảm giá</label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-xs text-green-600">
                    Giảm {formatPrice(appliedCoupon.discountAmount)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-red-500 hover:text-red-600 text-sm"
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
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleApplyCoupon();
                    }
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidatingCoupon ? "..." : "Áp dụng"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>Sub total</span>
              <span>{formatPrice(selection.price)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex items-center justify-between text-green-600">
                <span>Giảm giá ({appliedCoupon.code})</span>
                <span>-{formatPrice(appliedCoupon.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span>0</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatPrice(finalPrice)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isCreatingOrder}
            className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingOrder ? "Đang tạo đơn hàng..." : "Checkout"}
          </button>

          <Link
            href={ROUTES.SUBSCRIPTION}
            className="block text-center text-sm text-blue-600 hover:underline"
          >
            View Subscription Plans
          </Link>
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