import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { registerAffiliate, getAffiliateByUserId } from "~services/affiliate";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ResponseData = { success: boolean; affiliate?: unknown; message?: string; error?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === "POST") {
    try {
      const { userId, email, name } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: "User ID is required" });
      }

      if (typeof userId !== "string" || !UUID_REGEX.test(userId)) {
        return res.status(400).json({ success: false, error: "Invalid User ID format" });
      }

      const { affiliate, isNew } = await registerAffiliate(supabaseAdmin, userId);

      // Update user email/name on users table if provided (optional enhancement)
      // This is handled by user service, not affiliate service

      const statusMessages: Record<string, string> = {
        pending: "Đơn đăng ký của bạn đang chờ duyệt",
        active: "Bạn đã là affiliate",
        rejected: "Đơn đăng ký của bạn đã bị từ chối",
      };

      return res.status(200).json({
        success: true,
        affiliate,
        message: isNew
          ? "Đơn đăng ký affiliate đã được gửi. Vui lòng chờ quản trị viên duyệt."
          : statusMessages[affiliate.status] ?? "Bạn đã là affiliate",
      });
    } catch (error) {
      console.error("[API /api/affiliate/register POST]", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to register affiliate",
      });
    }
  }

  if (req.method === "GET") {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ success: false, error: "User ID is required" });
      }

      if (!UUID_REGEX.test(userId)) {
        return res.status(400).json({ success: false, error: "Invalid User ID format" });
      }

      const affiliate = await getAffiliateByUserId(supabaseAdmin, userId);

      if (!affiliate) {
        return res.status(404).json({ success: false, error: "Affiliate not found" });
      }

      return res.status(200).json({
        success: true,
        affiliate,
      });
    } catch (error) {
      console.error("[API /api/affiliate/register GET]", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch affiliate",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
