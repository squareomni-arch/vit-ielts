import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { createOrder } from "../../../services/order";
import { CreateOrderSchema } from "../../../services/lib/validation";

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
    // Validate input with Zod
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const {
      packageType,
      duration,
      skillType,
      amount,
      originalAmount,
      couponId,
      couponCode,
      discountAmount,
    } = parsed.data;

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

    // Affiliate ref từ cookie
    const affiliateRef = req.cookies[AFFILIATE_COOKIE_NAME];

    // Tạo order qua service (bao gồm coupon validation)
    const order = await createOrder(supabaseAdmin, {
      userId: finalUserId,
      packageType,
      duration,
      skillType: skillType as "reading" | "listening" | undefined,
      amount,
      originalAmount,
      couponId,
      couponCode,
      discountAmount,
      affiliateRef: affiliateRef || undefined,
    });

    // KHÔNG tính hoa hồng affiliate ở đây
    // Hoa hồng chỉ được tính khi order status = "completed" (sau khi thanh toán thành công)
    // TODO(task-09): Affiliate commission logic sẽ được migrate sang Supabase

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
