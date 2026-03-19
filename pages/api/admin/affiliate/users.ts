import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { getAffiliateLinks, getCommissions, getAffiliateVisits } from "~services/affiliate";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (req.method === "GET") {
    try {
      // Fetch all affiliates with user info
      const { data: affiliates, error } = await supabaseAdmin
        .from("affiliates")
        .select("*, users(email, name)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with stats (parallel fetch per affiliate)
      const affiliatesWithStats = await Promise.all(
        (affiliates ?? []).map(async (affiliate: any) => {
          const [links, commissions, visits] = await Promise.all([
            getAffiliateLinks(supabaseAdmin, affiliate.id).catch(() => []),
            getCommissions(supabaseAdmin, affiliate.id).catch(() => []),
            getAffiliateVisits(supabaseAdmin, affiliate.id).catch(() => []),
          ]);

          const totalCommissions = commissions.reduce(
            (sum: number, c: any) => sum + (c.commission_amount || 0),
            0
          );
          const pendingCommissions = commissions
            .filter((c: any) => c.status === "pending")
            .reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0);
          const totalVisits = visits.length;
          const totalConversions = visits.filter((v: any) => v.converted).length;

          return {
            ...affiliate,
            email: affiliate.users?.email ?? null,
            name: affiliate.users?.name ?? null,
            stats: {
              totalLinks: links.length,
              totalVisits,
              totalConversions,
              totalCommissions,
              pendingCommissions,
            },
          };
        })
      );

      return res.status(200).json({
        success: true,
        affiliates: affiliatesWithStats,
      });
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      return res.status(500).json({
        error: "Failed to fetch affiliates",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { action, affiliateId, status, customLink, commissionRate, email } = req.body;

      if (!action || !affiliateId) {
        return res.status(400).json({ error: "Action and affiliate ID are required" });
      }

      // Build update payload
      const updateData: Record<string, unknown> = {};

      if (action === "approve") {
        updateData.status = "active";
        if (customLink) updateData.custom_link = customLink;
        if (commissionRate !== undefined) updateData.commission_rate = Number(commissionRate);
      } else if (action === "reject") {
        updateData.status = "rejected";
      } else if (action === "update") {
        if (status) updateData.status = status;
        if (customLink !== undefined) updateData.custom_link = customLink;
        if (commissionRate !== undefined) updateData.commission_rate = Number(commissionRate);
      } else {
        return res.status(400).json({ error: `Unknown action: ${action}` });
      }

      const { data: updated, error } = await supabaseAdmin
        .from("affiliates")
        .update(updateData)
        .eq("id", affiliateId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        affiliate: updated,
        message: `Affiliate ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating affiliate:", error);
      return res.status(500).json({
        error: "Failed to update affiliate",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
