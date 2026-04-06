import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { WhyChooseUsConfig } from "@/shared/types/admin-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WhyChooseUsConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await readConfig<WhyChooseUsConfig>(supabaseAdmin, "home/why-choose-us");
    if (!config || !config.title) throw new Error("No config found");
    return res.status(200).json(config);
  } catch {
    const defaultConfig: WhyChooseUsConfig = {
      badge: "Tại sao chọn chúng tôi?",
      title: "Luyện thi IELTS Trên Giao Diện Thi Thật",
      description: "IPT cung cấp bộ đề thi thật tập trung vào các dạng câu hỏi xuất hiện thường xuyên.",
      stats: [
        { icon: "/assets/figma/icons/LovedbyStudents.svg", number: "5,000+", label: "HỌC VIÊN YÊU THÍCH", bgColor: "#D94A56" },
        { icon: "/assets/figma/icons/Aim.svg", number: "1,000+", label: "HỌC VIÊN ĐẠT AIM", bgColor: "#219653" },
        { icon: "/assets/figma/icons/Legit.svg", number: "20+", label: "ĐỀ THI THẬT", bgColor: "#5281F9" },
        { icon: "/assets/figma/icons/Goal.svg", number: "100+", label: "HỌC VIÊN ĐẠT 8.0", bgColor: "#FC945A" },
      ],
    };
    return res.status(200).json(defaultConfig);
  }
}
