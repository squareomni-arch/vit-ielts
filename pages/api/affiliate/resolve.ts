import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { resolveAffiliateRef } from "~services/affiliate";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Affiliate code is required" });
    }

    const result = await resolveAffiliateRef(supabaseAdmin, code);

    if (!result) {
      return res.status(404).json({ error: "Affiliate not found or not approved" });
    }

    return res.status(200).json({
      success: true,
      affiliateId: result.affiliateId,
      linkId: result.linkId ?? `temp_${result.affiliateId}`,
      ...(result.linkId ? {} : { neeLinkCreation: true }),
    });
  } catch (error) {
    console.error("[API /api/affiliate/resolve]", error);
    return res.status(500).json({
      error: "Failed to resolve affiliate",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
