import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getCommissions, createCommission } from "~services/affiliate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, orderId, amount } = req.body;

      if (!affiliateId || !orderId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { commission, isNew } = await createCommission(supabaseAdmin, {
        affiliateId,
        orderId,
        amount: Number(amount),
      });

      return res.status(200).json({
        success: true,
        commission,
        message: isNew ? "Commission created" : "Commission already exists for this order",
      });
    } catch (error) {
      console.error("[API /api/affiliate/commissions POST]", error);
      return res.status(500).json({
        error: "Failed to create commission",
        message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
      });
    }
  }

  if (req.method === "GET") {
    try {
      const { affiliateId } = req.query;

      if (!affiliateId || typeof affiliateId !== "string") {
        return res.status(400).json({ error: "Affiliate ID is required" });
      }

      const commissions = await getCommissions(supabaseAdmin, affiliateId);

      return res.status(200).json({
        success: true,
        commissions,
      });
    } catch (error) {
      console.error("[API /api/affiliate/commissions GET]", error);
      return res.status(500).json({
        error: "Failed to fetch commissions",
        message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
