import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { useCoupon } from "~services/coupon";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu couponId",
      });
    }

    await useCoupon(supabaseAdmin, couponId);

    return res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Có lỗi xảy ra khi áp dụng mã giảm giá",
      error: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
    });
  }
}
