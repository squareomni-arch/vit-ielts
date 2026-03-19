import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { HeroBannerConfig } from "@/shared/types/admin-config";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sectionName = "hero-banner";

  if (req.method === "GET") {
    try {
      const config = await readConfig<HeroBannerConfig>(supabaseAdmin, sectionName);

      // Trả nguyên config, không tự động chỉnh sửa để tránh làm mất dữ liệu (đặc biệt là avatars)
      return res.status(200).json(config);
    } catch (error) {
      return res.status(500).json({
        message: "Không đọc được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const user = await requireAdmin(req, res);
      if (!user) return;

      const body = req.body as HeroBannerConfig;

      // Ghi nguyên config được gửi từ admin (đã được validate ở client)
      await writeConfig<HeroBannerConfig>(supabaseAdmin, sectionName, body);
      return res.status(200).json({ message: "Lưu config thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Không ghi được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
