import type { NextApiRequest, NextApiResponse } from "next";
import { createApiSupabase } from "~supabase/server";
import { takeTheTest } from "~services/test-flow";
import { StartTestSchema } from "~services/lib/validation";
import { rateLimit } from "~lib/rate-limit";

type ResponseData = {
  success: boolean;
  data?: {
    id: string;
    quiz_id: string;
    test_part: number[];
    test_time: number;
    test_mode: string;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Rate limit: 30 test starts per minute per IP
  if (rateLimit(req, res, { windowMs: 60_000, max: 30, keyPrefix: "test-start" })) return;

  try {
    const supabase = createApiSupabase(req, res);

    const parsed = StartTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      });
    }

    const { quizId, testPart, testTime, testMode, retake } = parsed.data;

    const result = await takeTheTest(supabase, {
      quizId,
      testPart: testPart || [],
      testTime: testTime || 0,
      testMode: testMode || "practice",
      retake: retake || false,
    });

    return res.status(200).json({
      success: true,
      data: {
        id: result.id,
        quiz_id: result.quiz_id,
        test_part: result.test_part ?? [],
        test_time: result.test_time ?? 0,
        test_mode: result.test_mode ?? "practice",
      },
    });
  } catch (error) {
    console.error("[API /api/test-flow/start]", error);

    // Handle specific error types
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
