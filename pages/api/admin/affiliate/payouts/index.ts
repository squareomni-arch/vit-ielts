import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";
import { getPayouts } from "~services/payout";
import type { PayoutStatus } from "~services/payout";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const {
      status,
      affiliateId,
      dateFrom,
      dateTo,
      search,
      page,
      pageSize,
    } = req.query;

    const result = await getPayouts(supabaseAdmin, {
      status: status as PayoutStatus | undefined,
      affiliateId: affiliateId as string | undefined,
      dateFrom: dateFrom as string | undefined,
      dateTo: dateTo as string | undefined,
      search: search as string | undefined,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });

    // Enrich payouts with affiliate user info
    const enrichedPayouts = await Promise.all(
      result.payouts.map(async (payout) => {
        const { data: affiliate } = await supabaseAdmin
          .from("affiliates")
          .select("user_id, custom_link")
          .eq("id", payout.affiliate_id)
          .maybeSingle();

        let userName: string | null = null;
        let userEmail: string | null = null;

        if (affiliate?.user_id) {
          const { data: userProfile } = await supabaseAdmin
            .from("users")
            .select("name, email")
            .eq("id", affiliate.user_id)
            .maybeSingle();
          userName = userProfile?.name ?? null;
          userEmail = userProfile?.email ?? null;
        }

        return {
          ...payout,
          affiliate_custom_link: affiliate?.custom_link ?? null,
          user_name: userName,
          user_email: userEmail,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: enrichedPayouts,
      total: result.total,
    });
  } catch (error) {
    console.error("[API /api/admin/affiliate/payouts GET]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal error",
    });
  }
}
