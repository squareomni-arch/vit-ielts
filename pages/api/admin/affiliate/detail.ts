import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getAffiliateStats, getAffiliateLinks, getCommissions, getAffiliateVisits } from "../../../../services/affiliate";

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
      return res.status(400).json({
        success: false,
        error: "Affiliate ID is required",
      });
    }

    // Fetch affiliate with user info
    const { data: affiliate, error: affError } = await supabaseAdmin
      .from("affiliates")
      .select("*, users(email, name)")
      .eq("id", affiliateId)
      .single();

    if (affError || !affiliate) {
      return res.status(404).json({
        success: false,
        error: "Affiliate not found",
      });
    }

    // Fetch related data in parallel
    const [stats, links, commissions, visits] = await Promise.all([
      getAffiliateStats(supabaseAdmin, affiliateId),
      getAffiliateLinks(supabaseAdmin, affiliateId),
      getCommissions(supabaseAdmin, affiliateId),
      getAffiliateVisits(supabaseAdmin, affiliateId),
    ]);

    return res.status(200).json({
      success: true,
      affiliate: {
        ...affiliate,
        email: (affiliate.users as any)?.email ?? null,
        name: (affiliate.users as any)?.name ?? null,
        stats: {
          totalLinks: links.length,
          totalVisits: stats.totalVisits,
          totalConversions: stats.totalConversions,
          conversionRate: Math.round(stats.conversionRate * 100) / 100,
          totalCommissions: stats.totalCommissions,
          pendingCommissions: stats.pendingCommissions,
          paidCommissions: stats.paidCommissions,
        },
      },
      links,
      commissions: commissions.slice(0, 10),
      visits: visits.slice(0, 10),
    });
  } catch (error) {
    console.error("Error fetching affiliate detail:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch affiliate detail",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
