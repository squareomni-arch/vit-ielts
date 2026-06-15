import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { HeroBannerConfig } from "@/shared/types/admin-config";

/**
 * GET /api/admin/home/hero-banner-config
 * Returns hero banner config — used by admin preview or SSR fallback
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeroBannerConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await readConfig<HeroBannerConfig>(supabaseAdmin, "home/hero-banner");
    if (!config) throw new Error("No config found");
    return res.status(200).json(config);
  } catch {
    const defaultConfig: HeroBannerConfig = {
      title: { line1: "Vit IELTS Test", line2: "Thi", highlight: "Thử Như Thật" },
      subtitle: "Thi thử như thật với giao diện 1:1 và kho đề sát thực tế.",
      checklist: ["Giao diện thi máy", "Cập nhật xu hướng đề", "Chấm chữa chi tiết"],
      cta: { text: "Khám phá ngay", link: "/ielts-practice-library" },
      images: { screen: "/assets/figma/icons/screen 1.png", mascot: "/assets/figma/icons/like 1.png" },
    };
    return res.status(200).json(defaultConfig);
  }
}
