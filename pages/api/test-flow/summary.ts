import type { NextApiRequest, NextApiResponse } from "next";
import { createApiSupabase } from "~supabase/server";
import { rateLimit } from "~lib/rate-limit";
import { countQuestion } from "@/shared/lib/countQuestion";
import { safeParseJsonb } from "~services/lib/safeParseJsonb";

type ResponseData = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * Map a raw DB question row to the shape `countQuestion` expects.
 * This is deliberately identical to the mapping in `toExamSingleData`
 * (src/pages/ielts-exam-single/index.tsx) so both the detail page modal
 * and the homepage modal always compute the same question count.
 */
function mapQuestionForCounting(q: any) {
  const listOfQuestions = safeParseJsonb<any[]>(q.list_of_questions);
  const listOfOptions = safeParseJsonb<any[]>(q.list_of_options);
  const explanations = safeParseJsonb<any[]>(q.explanations) ?? [];
  const matchingQ = safeParseJsonb<any>(q.matching_question);
  const matrixQ = safeParseJsonb<any>(q.matrix_question);

  return {
    // type must be an array — countQuestion reads type?.[0]
    type: [q.type, q.type],
    question: q.question_text ?? undefined,
    list_of_questions: Array.isArray(listOfQuestions) ? listOfQuestions : undefined,
    list_of_options: Array.isArray(listOfOptions) ? listOfOptions : undefined,
    explanations: explanations.map((e: any) => ({ content: e.content ?? "" })),
    // matchingQuestion — handle both snake_case and camelCase stored JSONB
    matchingQuestion: matchingQ
      ? {
          layoutType: (() => {
            const lt = matchingQ.layout_type ?? matchingQ.layoutType ?? null;
            return Array.isArray(lt) ? lt[0] : lt;
          })(),
          summaryText: matchingQ.summary_text ?? matchingQ.summaryText ?? "",
          matchingItems: (
            Array.isArray(matchingQ.matching_items)
              ? matchingQ.matching_items
              : Array.isArray(matchingQ.matchingItems)
              ? matchingQ.matchingItems
              : []
          ).map((mi: any) => ({
            questionPart: mi.questionPart ?? mi.question_part ?? "",
            correctAnswer: mi.correctAnswer ?? mi.correct_answer ?? "",
          })),
        }
      : undefined,
    // matrixQuestion — handle both snake_case and camelCase stored JSONB
    matrixQuestion: matrixQ
      ? {
          matrixItems: (
            Array.isArray(matrixQ.matrix_items)
              ? matrixQ.matrix_items
              : Array.isArray(matrixQ.matrixItems)
              ? matrixQ.matrixItems
              : []
          ).map((mi: any) => ({
            itemText: mi.item_text ?? mi.itemText ?? "",
            correctCategoryLetter:
              mi.correct_category_letter ?? mi.correctCategoryLetter ?? "",
          })),
        }
      : undefined,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Rate limit: 60 summary fetches per minute per IP
  if (
    await rateLimit(req, res, {
      windowMs: 60_000,
      max: 60,
      keyPrefix: "test-summary",
    })
  )
    return;

  try {
    const supabase = createApiSupabase(req, res);
    const quizId =
      (req.query.quizId as string) || (req.body && req.body.quizId);

    if (!quizId) {
      return res.status(400).json({ success: false, error: "Missing quizId" });
    }

    // Full data fetch — same depth as getQuizBySlug used by the detail page
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*, passages(*, questions(*))")
      .eq("id", quizId)
      .eq("status", "published")
      .single();

    if (error || !quiz) {
      return res.status(404).json({ success: false, error: "Quiz not found" });
    }

    // Map passages: apply the same camelCase conversion as toExamSingleData,
    // compute questionCount, then discard heavy question data.
    const passages = ((quiz.passages as any[]) ?? [])
      .sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
      .map((p: any) => {
        const mappedQuestions = ((p.questions as any[]) ?? [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map(mapQuestionForCounting);

        const questionCount = countQuestion({ questions: mappedQuestions } as any);

        return {
          id: p.id,
          sort_order: p.sort_order,
          questionCount,
          questions: [], // stripped — only count matters for the modal
        };
      });

    // Shape compatible with ExamModeModal (quizFields wrapper)
    const summary = {
      id: quiz.id,
      title: quiz.title,
      slug: quiz.slug,
      featuredImage: quiz.featured_image ?? null,
      quizFields: {
        proUserOnly: quiz.pro_user_only,
        testsTaken: quiz.tests_taken,
        skill: [quiz.skill, quiz.skill],
        type: [quiz.type, quiz.type],
        scoreType: quiz.score_type ?? null,
        time: quiz.time_minutes,
        passages,
      },
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("[API /api/test-flow/summary]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
