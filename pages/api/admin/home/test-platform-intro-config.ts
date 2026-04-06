import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { TestPlatformIntroConfig } from "@/shared/types/admin-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestPlatformIntroConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await readConfig<TestPlatformIntroConfig>(supabaseAdmin, "home/test-platform-intro");
    if (!config) throw new Error("No config found");
    return res.status(200).json(config);
  } catch {
    const defaultConfig: TestPlatformIntroConfig = {
      badge: "PREMIUM",
      title: "Khám Phá Kho Đề",
      titleHighlight: "Dự Đoán",
      cards: [
        { title: "IELTS Full Test", icon: "/assets/figma/icons/book (1) 1.svg", bg: "/assets/figma/icons/Background-1.png", color: "from-rose-600 to-rose-500", href: "/ielts-exam-library" },
        { title: "Listening Practice", icon: "/assets/figma/icons/listen 1.svg", bg: "/assets/figma/icons/Background-2.png", color: "from-emerald-600 to-emerald-500", href: "/ielts-practice-library?skill=listening" },
        { title: "Reading Practice", icon: "/assets/figma/icons/reading-book 1.svg", bg: "/assets/figma/icons/Background-3.png", color: "from-orange-600 to-orange-400", href: "/ielts-practice-library?skill=reading" },
      ],
    };
    return res.status(200).json(defaultConfig);
  }
}
