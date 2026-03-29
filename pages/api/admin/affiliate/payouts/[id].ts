import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import {
  approvePayoutRequest,
  rejectPayoutRequest,
  completePayoutManually,
} from "~services/payout";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Payout ID is required" });
  }

  const { action, reason, transactionCode } = req.body;

  try {
    switch (action) {
      case "approve": {
        const payout = await approvePayoutRequest(supabaseAdmin, id);
        return res.status(200).json({ success: true, payout });
      }

      case "reject": {
        if (!reason) {
          return res.status(400).json({ success: false, error: "Lý do từ chối là bắt buộc" });
        }
        await rejectPayoutRequest(supabaseAdmin, id, reason);
        return res.status(200).json({ success: true, message: "Đã từ chối yêu cầu rút tiền" });
      }

      case "complete": {
        const payout = await completePayoutManually(supabaseAdmin, id, transactionCode);
        return res.status(200).json({ success: true, payout });
      }

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action. Use: approve, reject, or complete",
        });
    }
  } catch (error) {
    console.error(`[API /api/admin/affiliate/payouts/${id} PUT]`, error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}
