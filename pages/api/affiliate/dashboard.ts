import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { getAffiliateByUserId, getAffiliateStats } from "~services/affiliate";
import { getBankInfo, getPayoutsByAffiliate } from "~services/payout";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    // Authenticate
    const supabase = createApiSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    // Get affiliate for this user
    const affiliate = await getAffiliateByUserId(supabaseAdmin, user.id);
    if (!affiliate) {
      return res.status(404).json({ success: false, error: "Affiliate not found" });
    }

    // Fetch all data concurrently
    const [stats, bankInfo, payoutsResult] = await Promise.all([
      getAffiliateStats(supabaseAdmin, affiliate.id),
      getBankInfo(supabaseAdmin, affiliate.id),
      getPayoutsByAffiliate(supabaseAdmin, affiliate.id, { page: 1, pageSize: 5 }),
    ]);

    // Get affiliate balance from the affiliate record
    const { data: affiliateWithBalance } = await supabaseAdmin
      .from("affiliates")
      .select("balance, total_earned, commission_rate")
      .eq("id", affiliate.id)
      .single();

    return res.status(200).json({
      success: true,
      dashboard: {
        stats,
        balance: affiliateWithBalance?.balance ?? 0,
        totalEarned: affiliateWithBalance?.total_earned ?? 0,
        commissionRate: affiliateWithBalance?.commission_rate ?? 0.2,
        hasBankInfo: !!bankInfo,
        recentPayouts: payoutsResult.payouts,
      },
    });
  } catch (error) {
    console.error("[API /api/affiliate/dashboard]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}
