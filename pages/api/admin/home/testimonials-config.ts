import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { TestimonialsConfig } from "@/shared/types/admin-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestimonialsConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await readConfig<TestimonialsConfig>(supabaseAdmin, "home/testimonials");
    if (!config || !config.title) throw new Error("No config found");
    return res.status(200).json(config);
  } catch {
    const defaultConfig: TestimonialsConfig = {
      title: "Phản hồi từ học viên",
      description: "Trải nghiệm thực tế từ học viên đã luyện đề sát cấu trúc thi thật.",
      cta: { text: "Xem Thêm Phản Hồi", link: "#" },
      reviews: [
        { name: "Nguyễn Thị Lan", score: "IELTS 7.0", avatar: "/assets/figma/icons/Background-1.png", review: "Giao diện thi rất giống thi thật.", rating: 5 },
        { name: "Trần Văn Minh", score: "IELTS 6.5", avatar: "/assets/figma/icons/Background-2.png", review: "Đề thi sát với cấu trúc thật.", rating: 5 },
      ],
    };
    return res.status(200).json(defaultConfig);
  }
}
