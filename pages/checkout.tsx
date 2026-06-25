import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/widgets/layouts";
import {
  calculatePrice,
  formatPrice,
  SkillType,
} from "@/pages/subscription/ui/subscription-plans/pricing";
import { ROUTES } from "@/shared/routes";
import { useAuth } from "@/appx/providers/auth-provider";
import { createClient } from "~supabase/client";
import { toast } from "react-toastify";
import Link from "next/link";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";
import { DEFAULT_COURSE_PACKAGES } from "@/shared/constants";

/** Coupon shape returned by /api/coupons/validate */
type AppliedCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | null;
  value: number;
  discountAmount: number;
};

const CheckoutPage = () => {
  const router = useRouter();
  const { type, months, skill, coupon } = router.query;
  const { currentUser } = useAuth();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [config, setConfig] = useState<CoursePackagesConfig>(DEFAULT_COURSE_PACKAGES);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 1. Fetch config on mount + resolve email from Supabase session (presentation only)
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

    // Resolve email from Supabase session (presentation-only — not sent to order API)
    const supabase = createClient();
    void supabase.auth.getUser().then(
      (result: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
        setUserEmail(result.data.user?.email ?? null);
      }
    );
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
    if (!appliedCoupon) return selection.price;

    let discount = 0;
    if (appliedCoupon.type === "percent") {
      discount = Math.round(selection.price * (appliedCoupon.value / 100));
    } else {
      discount = appliedCoupon.value; // It maps to 'value' in the API response now
    }
    
    return Math.max(0, selection.price - discount);
  }, [selection.price, appliedCoupon]);

  const discountDisplayAmount = useMemo(() => {
    if (!appliedCoupon || !selection.price) return 0;
    if (appliedCoupon.type === "percent") {
      return Math.round(selection.price * (appliedCoupon.value / 100));
    }
    return appliedCoupon.value;
  }, [appliedCoupon, selection.price]);

  // `silent` suppresses toasts — used when auto-applying a coupon from the URL.
  const applyCoupon = async (code: string, silent = false) => {
    const trimmed = code.trim();
    if (!trimmed) {
      if (!silent) toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponCode(data.coupon.code);
        if (!silent) toast.success(data.message || "Áp dụng mã giảm giá thành công");
      } else {
        setAppliedCoupon(null);
        if (!silent) toast.error(data.message || "Mã giảm giá không hợp lệ");
      }
    } catch (error) {
      if (!silent) toast.error("Có lỗi xảy ra khi kiểm tra mã giảm giá");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = () => applyCoupon(couponCode);

  // Pre-fill + auto-apply a coupon passed via the URL (e.g. landing → ?coupon=VIT50).
  useEffect(() => {
    if (!router.isReady) return;
    const code = (Array.isArray(coupon) ? coupon[0] : coupon)?.toUpperCase();
    if (code && !appliedCoupon) {
      setCouponCode(code);
      void applyCoupon(code, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, coupon]);

  const productName =
    selection.pkgType === "combo"
      ? "Combo (Listening + Reading)"
      : `Single Pack - ${selection.skillType}`;

  // 3. Hàm xử lý Checkout
  const handleCheckout = async () => {
    // Not logged in → send to login, then back here to finish paying.
    // ponytail: returns to checkout where they click Pay again; auto-resubmit if asked.
    if (!currentUser?.id) {
      router.push(ROUTES.LOGIN(router.asPath));
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
          <p className="mt-4 text-ink-muted text-body-s font-medium">
            Loading checkout details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6" data-section="checkout-main">
      {/* Page heading */}
      <div>
        <h1 className="font-display text-heading-1 text-ink-900 leading-tight">
          Checkout
        </h1>
        <p className="text-body-s text-ink-muted mt-1">
          You&apos;re one step away from Pro.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT CARD: Billing details + Payment method ── */}
        <div className="flex-1 min-w-0 rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 space-y-8">

          {/* Billing details */}
          <section>
            <h2 className="font-display text-heading-2 text-ink-900 mb-6">
              Billing details
            </h2>

            <div className="space-y-5">
              {/* Full name — read-only from currentUser */}
              <div>
                <label className="block text-body-s font-semibold text-ink-900 mb-1.5">
                  Full name
                </label>
                <div className="w-full rounded-lg border border-border-hairline bg-surface-card px-4 py-3 text-body-m text-ink-900">
                  {currentUser?.name || "—"}
                </div>
              </div>

              {/* Email — read-only from currentUser */}
              <div>
                <label className="block text-body-s font-semibold text-ink-900 mb-1.5">
                  Email address
                </label>
                <div className="w-full rounded-lg border border-border-hairline bg-surface-card px-4 py-3 text-body-m text-ink-900">
                  {userEmail || "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Divider */}
          <hr className="border-border-hairline" />

          {/* Payment method */}
          <section>
            <h2 className="font-display text-heading-2 text-ink-900 mb-4">
              Payment method
            </h2>
            <div className="rounded-xl border border-border-hairline bg-surface-card p-5 flex items-start gap-4">
              <span
                className="material-symbols-rounded text-ink-muted mt-0.5 shrink-0"
                aria-hidden="true"
              >
                account_balance
              </span>
              <div>
                <p className="text-body-m font-semibold text-ink-900">
                  Bank transfer / Online payment
                </p>
                <p className="text-body-s text-ink-muted mt-1">
                  Payment instructions will be sent to your email after you confirm the order.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── RIGHT CARD: Order summary ── */}
        <div className="w-full lg:w-[380px] shrink-0 rounded-2xl border border-border-hairline bg-surface-card shadow-primary p-8 space-y-6">

          <h2 className="font-display text-heading-2 text-ink-900">
            Order summary
          </h2>

          {/* Plan description */}
          <div className="rounded-xl border border-border-hairline bg-surface-card px-4 py-3">
            <p className="text-body-m font-semibold text-ink-900">{productName}</p>
            <p className="text-body-s text-ink-muted mt-0.5">
              {selection.duration} month{selection.duration > 1 ? "s" : ""}
            </p>
          </div>

          {/* Coupon code */}
          <div className="space-y-2">
            <label className="block text-body-s font-semibold text-ink-900">
              Mã giảm giá
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-lg border border-border-hairline bg-surface-card px-4 py-3">
                <div>
                  <p className="text-body-s font-bold text-accent-teal">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-caption-bold text-accent-teal">
                    Giảm{" "}
                    {appliedCoupon.type === "percent"
                      ? `${appliedCoupon.value}%`
                      : formatPrice(appliedCoupon.value)}{" "}
                    ({formatPrice(discountDisplayAmount)})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                  }}
                  className="text-body-s font-bold text-danger hover:opacity-80 transition-opacity"
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
                  className="flex-1 min-w-0 rounded-lg border border-border-hairline bg-surface-card px-4 py-2.5 text-body-s text-ink-900 placeholder:text-ink-muted focus:border-ink-700 focus:outline-none transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleApplyCoupon();
                  }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="shrink-0 px-4 py-2.5 rounded-lg bg-ink-900 hover:bg-ink-700 text-surface-card text-body-s font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="space-y-3 text-body-s">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Sub-total</span>
              <span className="font-medium text-ink-900">
                {formatPrice(selection.price)}
              </span>
            </div>

            {appliedCoupon && (
              <div className="flex items-center justify-between text-accent-teal">
                <span>Giảm giá ({appliedCoupon.code})</span>
                <span className="font-bold">
                  -{formatPrice(discountDisplayAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Tax</span>
              <span className="font-medium text-ink-900">
                {formatPrice(0)}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-border-hairline pt-5 flex items-baseline justify-between">
            <span className="font-display text-title-m text-ink-900">Total</span>
            <span className="font-display text-heading-2 text-ink-900">
              {formatPrice(finalPrice)}
            </span>
          </div>

          {/* Pay button — dark, full-width (Figma "Pay {amount}" CTA) */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isCreatingOrder}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-ink-900 hover:bg-ink-700 text-surface-card font-display font-bold text-body-m py-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-rounded text-[20px]" aria-hidden="true">
              shopping_bag
            </span>
            {isCreatingOrder ? "Đang xử lý..." : `Pay ${formatPrice(finalPrice)}`}
          </button>

          {/* Benefits list */}
          <ul className="space-y-2.5">
            {[
              "Cancel anytime",
              "30-day money-back guarantee",
              "Instant access to all tests",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-body-s text-ink-muted">
                <span className="material-symbols-rounded text-[18px] text-ink-muted" aria-hidden="true">
                  check_circle
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          {/* Back to plans link */}
          <div className="text-center pt-1">
            <Link
              href={ROUTES.SUBSCRIPTION}
              className="text-body-s font-medium text-ink-muted hover:text-ink-900 transition-colors underline underline-offset-2"
            >
              View Subscription Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

CheckoutPage.Layout = AppShell;

// Disable static generation để tránh lỗi prerender
// Trang này cần client-side data (router query, auth, config)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default CheckoutPage;