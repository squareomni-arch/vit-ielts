import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/ssr";
import { takeTheTest } from "~services/test-flow";

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

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return Object.entries(req.cookies).map(([name, value]) => ({
              name,
              value: value || "",
            }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.setHeader(
                "Set-Cookie",
                `${name}=${value}; Path=/; ${options?.maxAge ? `Max-Age=${options.maxAge}` : ""}`
              );
            });
          },
        },
      }
    );

    const { quizId, testPart, testTime, testMode, retake } = req.body;

    if (!quizId) {
      return res.status(400).json({
        success: false,
        error: "quizId is required",
      });
    }

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
