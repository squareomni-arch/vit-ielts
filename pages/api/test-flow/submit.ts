import type { NextApiRequest, NextApiResponse } from "next";
import { createApiSupabase, createAdminApiSupabase } from "~supabase/server";
import { submitTestResult } from "~services/test-flow";
import { SubmitTestSchema } from "~services/lib/validation";

type ResponseData = {
  success: boolean;
  data?: { id: string; score: number };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    let supabase = createApiSupabase(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    // Fallback to admin session for preview mode
    if (!user) {
      const adminSupabase = createAdminApiSupabase(req, res);
      const { data: { user: adminUser } } = await adminSupabase.auth.getUser();
      if (adminUser) {
        supabase = adminSupabase;
      }
    }

    const parsed = SubmitTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { testId, answers, timeLeft } = parsed.data;

    // Parse answers if string
    const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;

    const result = await submitTestResult(
      supabase,
      testId,
      parsedAnswers,
      timeLeft || "00:00"
    );

    return res.status(200).json({
      success: true,
      data: { id: result.id, score: result.score ?? 0 },
    });
  } catch (error) {
    console.error("[API /api/test-flow/submit]", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    const statusCode = errorMessage.includes("đăng nhập") ? 401
      : errorMessage.includes("PRO") ? 403
      : 500;
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
}
