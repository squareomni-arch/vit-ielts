import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { validateCoupon } from "../../../services/coupon";
import { ValidateCouponSchema } from "../../../services/lib/validation";
import { rateLimit } from "~lib/rate-limit";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Rate limit: 20 coupon validations per minute per IP
  if (rateLimit(req, res, { windowMs: 60_000, max: 20, keyPrefix: "coupon" })) return;

  try {
    const parsed = ValidateCouponSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        valid: false,
        message: "Vui lòng nhập mã giảm giá hợp lệ",
      });
    }

    const { code } = parsed.data;

    const result = await validateCoupon(supabaseAdmin, code);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      valid: false,
      message: "Có lỗi xảy ra khi kiểm tra mã giảm giá",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
