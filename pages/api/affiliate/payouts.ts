import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { getAffiliateByUserId } from "~services/affiliate";
import { createPayoutRequest, getPayoutsByAffiliate } from "~services/payout";
import { CreatePayoutSchema } from "~services/lib/validation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
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

  // GET — list payouts
  if (req.method === "GET") {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const result = await getPayoutsByAffiliate(supabaseAdmin, affiliate.id, { page, pageSize });

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("[API /api/affiliate/payouts GET]", error);
      return res.status(500).json({ success: false, error: "Failed to fetch payouts" });
    }
  }

  // POST — create payout request
  if (req.method === "POST") {
    try {
      const parsed = CreatePayoutSchema.safeParse({
        ...req.body,
        affiliateId: affiliate.id,
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      // Load system config to get min payout amount
      const { data: configRow } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_config")
        .maybeSingle();

      const minPayout = configRow?.value?.min_payout_amount ?? 200000;

      const payout = await createPayoutRequest(
        supabaseAdmin,
        affiliate.id,
        parsed.data.amount,
        minPayout,
      );

      return res.status(200).json({ success: true, payout });
    } catch (error) {
      console.error("[API /api/affiliate/payouts POST]", error);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payout request",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
