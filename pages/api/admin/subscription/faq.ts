import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "~services/cms-config";
import { supabaseAdmin } from "~supabase/admin";
import type { FAQConfig } from "@/shared/types/admin-config";
import { requireAdmin } from "~lib/admin-auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sectionName = "subscription/faq";

  if (req.method === "GET") {
    try {
      const config = await readConfig<FAQConfig>(supabaseAdmin, sectionName);
      return res.status(200).json(config);
    } catch (error) {
      // Nếu file chưa tồn tại, trả về config mặc định
      const defaultConfig: FAQConfig = {
        badge: {
          text: "FREQUENTLY ASKED QUESTIONS",
        },
        title: "Have a Question with Histudy University?",
        description:
          "Its an educational platform Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        items: [
          {
            question: "What is Histudy ? How does it work?",
            answer:
              "Histudy is an educational platform designed to help students learn and grow. It works by providing comprehensive learning materials, interactive courses, and personalized learning paths to help you achieve your educational goals.",
          },
          {
            question: "How can I get the customer support?",
            answer:
              "You can reach our customer support team through multiple channels including email, live chat, or phone. Our support team is available 24/7 to assist you with any questions or concerns you may have.",
          },
          {
            question:
              "Can I get update regularly and For how long do I get updates?",
            answer:
              "Yes, you will receive regular updates about new courses, features, and educational content. Updates are provided for the duration of your subscription period, ensuring you always have access to the latest materials and improvements.",
          },
          {
            question: "15 Things To Know About Education?",
            answer:
              "Education is a lifelong journey that involves continuous learning, critical thinking, and personal growth. It encompasses various forms of learning including formal education, self-study, and practical experience. Understanding key educational principles can help you make the most of your learning experience.",
          },
        ],
      };
      return res.status(200).json(defaultConfig);
    }
  }

  if (req.method === "POST") {
    try {
      const user = await requireAdmin(req, res);
      if (!user) return;

      const body = req.body as FAQConfig;
      await writeConfig<FAQConfig>(supabaseAdmin, sectionName, body);
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

