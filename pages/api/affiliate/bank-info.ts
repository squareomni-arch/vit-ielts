import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "~supabase/admin";
import { createApiSupabase } from "~supabase/server";
import { getBankInfo, saveBankInfo } from "~services/payout";
import { getAffiliateByUserId } from "~services/affiliate";
import { SaveBankInfoSchema } from "~services/lib/validation";

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

  // GET — retrieve bank info
  if (req.method === "GET") {
    try {
      const bankInfo = await getBankInfo(supabaseAdmin, affiliate.id);
      return res.status(200).json({ success: true, bankInfo });
    } catch (error) {
      console.error("[API /api/affiliate/bank-info GET]", error);
      return res.status(500).json({ success: false, error: "Failed to fetch bank info" });
    }
  }

  // PUT — update bank info
  if (req.method === "PUT") {
    try {
      const parsed = SaveBankInfoSchema.safeParse({
        ...req.body,
        affiliateId: affiliate.id,
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(", "),
        });
      }

      const { accountHolder, accountNumber, bankName, bankCode, bankBranch } = parsed.data;

      const bankInfo = await saveBankInfo(supabaseAdmin, affiliate.id, {
        account_holder: accountHolder,
        account_number: accountNumber,
        bank_name: bankName,
        bank_code: bankCode,
        bank_branch: bankBranch,
      });

      return res.status(200).json({ success: true, bankInfo });
    } catch (error) {
      console.error("[API /api/affiliate/bank-info PUT]", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to save bank info",
      });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
