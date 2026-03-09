import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { HeroBannerConfig } from "@/shared/types/admin-config";

/**
 * API route để đọc hero banner config
 * Chỉ dùng trong getServerSideProps
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeroBannerConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await readConfig<HeroBannerConfig>(supabaseAdmin, "hero-banner");
    // Validate config có đầy đủ properties
    if (!config || !config.trustpilot || !config.trustpilot.image) {
      throw new Error("Invalid config structure");
    }
    return res.status(200).json(config);
  } catch (error) {
    // Trả về config mặc định nếu file không tồn tại
    const defaultConfig: HeroBannerConfig = {
      trustpilot: {
        image: "/img-admin/o-trustpilot.png",
        rating: "Excellent 4.9 out of 5",
      },
      headline: {
        line1: "Education Is The Best",
        line2: "Key",
        line3: "Success",
        line4: "In Life",
      },
      description: {
        text: "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.",
        highlightText: "Velit officia consequat.",
      },
      buttons: {
        primary: {
          text: "Get Started",
          link: "/account/register",
        },
        secondary: {
          text: "Watch Video",
          link: "#",
        },
      },
      bannerImage: "/img-admin/o-banner.png",
      backgroundImage: "",
      featureCards: [],
      decorativeShape: {
        image: "/img-admin/o-shape-1.png",
      },
    };
    return res.status(200).json(defaultConfig);
  }
}
