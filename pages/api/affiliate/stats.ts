import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getAffiliateStats } from "~services/affiliate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { affiliateId } = req.query;

    if (!affiliateId || typeof affiliateId !== "string") {
      return res.status(400).json({ error: "Affiliate ID is required" });
    }

    const stats = await getAffiliateStats(supabaseAdmin, affiliateId);

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[API /api/affiliate/stats]", error);
    return res.status(500).json({
      error: "Failed to fetch affiliate stats",
      message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
    });
  }
}
