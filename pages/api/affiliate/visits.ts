import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { trackVisit, getAffiliateVisits } from "~services/affiliate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, linkId, ipAddress, userAgent } = req.body;

      if (!affiliateId || !linkId) {
        return res.status(400).json({ error: "Affiliate ID and Link ID are required" });
      }

      const visit = await trackVisit(supabaseAdmin, affiliateId, linkId, ipAddress, userAgent);

      return res.status(200).json({
        success: true,
        visit,
      });
    } catch (error) {
      console.error("[API /api/affiliate/visits POST]", error);
      return res.status(500).json({
        error: "Failed to record visit",
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

      const visits = await getAffiliateVisits(supabaseAdmin, affiliateId);

      return res.status(200).json({
        success: true,
        visits,
      });
    } catch (error) {
      console.error("[API /api/affiliate/visits GET]", error);
      return res.status(500).json({
        error: "Failed to fetch visits",
        message: error instanceof Error ? error.message : (error as any)?.message ?? String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
