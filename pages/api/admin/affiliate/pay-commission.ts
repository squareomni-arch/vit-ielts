import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { commissionId } = req.body;

    if (!commissionId || typeof commissionId !== "string") {
      return res.status(400).json({ error: "Commission ID is required" });
    }

    // Fetch commission
    const { data: commission, error: fetchError } = await supabaseAdmin
      .from("affiliate_commissions")
      .select("id, status")
      .eq("id", commissionId)
      .single();

    if (fetchError || !commission) {
      return res.status(404).json({ error: "Commission not found" });
    }

    if (commission.status === "paid") {
      return res.status(400).json({
        error: "Commission already paid",
        message: "Hoa hồng này đã được thanh toán rồi",
      });
    }

    if (commission.status !== "pending") {
      return res.status(400).json({
        error: "Invalid commission status",
        message: "Chỉ có thể thanh toán hoa hồng đang chờ thanh toán",
      });
    }

    // Update commission status to paid
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("affiliate_commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", commissionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "Thanh toán hoa hồng thành công",
      commission: updated,
    });
  } catch (error) {
    console.error("Error paying commission:", error);
    return res.status(500).json({
      error: "Failed to pay commission",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
