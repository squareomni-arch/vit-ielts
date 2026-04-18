import type { NextApiRequest, NextApiResponse } from "next";
import { createApiSupabase, createAdminApiSupabase } from "~supabase/server";
import { saveTestResult } from "~services/test-flow";

type ResponseData = {
  success: boolean;
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

    const { testId, answers, timeLeft } = req.body;

    if (!testId || !answers) {
      return res.status(400).json({
        success: false,
        error: "testId and answers are required",
      });
    }

    const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;

    await saveTestResult(
      supabase,
      testId,
      parsedAnswers,
      timeLeft || "00:00"
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[API /api/test-flow/save-draft]", error);
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
