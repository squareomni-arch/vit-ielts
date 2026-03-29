import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  // GET — read config
  if (req.method === "GET") {
    try {
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "affiliate_config")
        .maybeSingle();

      return res.status(200).json({
        success: true,
        config: data?.value ?? {
          commission_rate: 0.2,
          cookie_duration_days: 30,
          min_payout_amount: 200000,
          click_rate_limit_per_ip_hours: 24,
          click_velocity_threshold: 100,
          waiting_period_days: 7,
          payout_transfer_prefix: "PAYOUT",
        },
      });
    } catch (error) {
      console.error("[API /api/admin/affiliate/config GET]", error);
      return res.status(500).json({ success: false, error: "Internal error" });
    }
  }

  // PUT — update config
  if (req.method === "PUT") {
    try {
      const newConfig = req.body;

      // Validate required fields
      if (typeof newConfig !== "object" || !newConfig) {
        return res.status(400).json({ success: false, error: "Invalid config" });
      }

      const { error } = await supabaseAdmin
        .from("site_settings")
        .upsert(
          {
            key: "affiliate_config",
            value: newConfig,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

      if (error) throw error;

      return res.status(200).json({ success: true, config: newConfig });
    } catch (error) {
      console.error("[API /api/admin/affiliate/config PUT]", error);
      return res.status(500).json({ success: false, error: "Internal error" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
