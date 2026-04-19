import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { createOrder, findExistingPendingOrder } from "~services/order";
import { CreateOrderSchema } from "~services/lib/validation";
import { readConfig } from "~services/cms-config";
import { validateCoupon } from "~services/coupon";
import { calculatePrice } from "@/pages/subscription/ui/subscription-plans/pricing";
import type { CoursePackagesConfig } from "@/shared/types/admin-config";

const AFFILIATE_COOKIE_NAME = "affiliate_ref";

type ResponseData = {
  success: boolean;
  order?: Record<string, unknown>;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Validate input with Zod (only packageType, duration, skillType, couponCode)
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { packageType, duration, skillType, couponCode } = parsed.data;

    // Extract userId from authenticated Supabase session (NOT from client body)
    const supabase = createApiSupabase(req, res);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để tiếp tục",
      });
    }

    const finalUserId = user.id;

    // ─── SERVER-SIDE PRICE CALCULATION ─────────────────────────────────
    // Read pricing config from CMS (same source as the frontend)
    const config = await readConfig<CoursePackagesConfig>(
      supabaseAdmin,
      "subscription/course-packages",
    );

    // Build price table from CMS config (same logic as checkout.tsx)
    const pkgConfig = packageType === "combo" ? config?.combo : config?.single;
    const basePrice = pkgConfig?.basePrice;
    const monthlyIncrement = pkgConfig?.monthlyIncrementPrice ?? 100000;
    const priceTable = pkgConfig?.plans?.reduce<Record<number, number>>(
      (acc, plan) => {
        acc[plan.months] = plan.price;
        return acc;
      },
      {},
    );

    const originalAmount = calculatePrice(
      packageType,
      duration,
      basePrice,
      monthlyIncrement,
      priceTable,
    );

    if (originalAmount === null || originalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Gói đăng ký không hợp lệ. Vui lòng chọn lại.",
      });
    }

    // ─── COUPON VALIDATION (SERVER-SIDE) ────────────────────────────────
    let discountAmount = 0;
    let validatedCouponId: string | null = null;
    let validatedCouponCode: string | null = null;

    if (couponCode) {
      const couponResult = await validateCoupon(supabaseAdmin, couponCode);

      if (couponResult.valid && couponResult.coupon) {
        validatedCouponId = couponResult.coupon.id;
        validatedCouponCode = couponResult.coupon.code;

        // Calculate discount based on coupon type
        if (couponResult.coupon.type === "percent") {
          discountAmount = Math.round(originalAmount * (couponResult.coupon.value / 100));
        } else {
          // "fixed" type — value is the discount amount
          discountAmount = couponResult.coupon.value;
        }
      } else {
        return res.status(400).json({
          success: false,
          error: couponResult.message || "Mã giảm giá không hợp lệ",
        });
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // Affiliate ref từ cookie — nhưng bỏ qua nếu ref resolve về chính user hiện tại
    // để chặn self-referral (user tự credit commission cho chính mình).
    let affiliateRef: string | undefined = req.cookies[AFFILIATE_COOKIE_NAME];
    if (affiliateRef) {
      const { resolveAffiliateRef } = await import("~services/affiliate");
      try {
        const resolved = await resolveAffiliateRef(supabaseAdmin, affiliateRef);
        if (resolved?.affiliateId) {
          const { data: affOwner } = await supabaseAdmin
            .from("affiliates")
            .select("user_id")
            .eq("id", resolved.affiliateId)
            .maybeSingle();
          if (affOwner?.user_id === finalUserId) {
            affiliateRef = undefined;
          }
        }
      } catch {
        // Nếu resolve lỗi, bỏ qua affiliateRef cho an toàn
        affiliateRef = undefined;
      }
    }

    // ─── DEDUP: Reuse existing pending order if same params ─────────────
    const existingOrder = await findExistingPendingOrder(
      supabaseAdmin,
      finalUserId,
      packageType,
      duration,
    );

    if (existingOrder) {
      return res.status(200).json({
        success: true,
        order: {
          id: existingOrder.id,
          orderId: existingOrder.order_id,
          reused: true,
          orderFields: {
            packageType: existingOrder.package_type,
            duration: existingOrder.duration,
            skillType: existingOrder.skill_type,
            amount: existingOrder.amount,
            status: existingOrder.status,
            paymentMethod: existingOrder.payment_method,
            transferContent: existingOrder.transfer_content,
            createdAt: existingOrder.created_at,
          },
        },
      });
    }

    // Tạo order qua service (bao gồm coupon usage increment)
    const order = await createOrder(supabaseAdmin, {
      userId: finalUserId,
      packageType,
      duration,
      skillType: skillType as "reading" | "listening" | undefined,
      amount: finalAmount,
      originalAmount,
      couponId: validatedCouponId ?? undefined,
      couponCode: validatedCouponCode ?? undefined,
      discountAmount,
      affiliateRef: affiliateRef || undefined,
    });

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        orderId: order.order_id,
        orderFields: {
          packageType: order.package_type,
          duration: order.duration,
          skillType: order.skill_type,
          amount: order.amount,
          status: order.status,
          paymentMethod: order.payment_method,
          transferContent: order.transfer_content,
          createdAt: order.created_at,
        },
      },
    });
  } catch (error) {
    console.error("[API /api/orders/create]", error);

    // Coupon validation errors → 400
    if (error instanceof Error && error.message.includes("giảm giá")) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // FK constraint violation (e.g. temp_ userId not in users table) → 400
    const pgErr = error as any;
    if (pgErr?.code === "23503") {
      return res.status(400).json({
        success: false,
        error: "User ID không hợp lệ. Vui lòng đăng nhập trước khi đặt hàng.",
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
