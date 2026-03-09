import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";
import { createServerSupabase } from "~supabase/server";
import { getQuizBySlug } from "~services/quiz";
import { takeTheTest, getTestResult as getTestResultService } from "~services/test-flow";
import type { ITestResult } from "./api";
import type { QuizWithPassages, Quiz } from "~services/types/database";
import type { IPracticeSingle } from "../ielts-practice-single/api";

export { PageTakeTheTestWrapper } from "./ui";

/**
 * Map Supabase QuizWithPassages → legacy IPracticeSingle shape
 * (reused from ielts-practice-single/index.tsx pattern)
 */
function toIPracticeSingle(quiz: QuizWithPassages): IPracticeSingle {
  return {
    id: quiz.id,
    title: quiz.title,
    excerpt: quiz.excerpt ?? "",
    seo: {} as IPracticeSingle["seo"],
    link: `/ielts-practice-library/${quiz.slug}`,
    slug: quiz.slug,
    hasAccess: true, // Already checked access at this point
    relatedPracticeQuizzes: [],
    author: {
      node: {
        userData: {},
        name: "IELTS Prediction",
      },
    },
    date: quiz.published_at ?? quiz.created_at,
    featuredImage: quiz.featured_image
      ? { node: { sourceUrl: quiz.featured_image, altText: quiz.title } }
      : undefined,
    quizFields: {
      testsTaken: quiz.tests_taken ?? 0,
      proUserOnly: quiz.pro_user_only,
      type: [(quiz.type as "practice" | "academic" | "general"), quiz.type],
      skill: [quiz.skill, quiz.skill],
      time: quiz.time_minutes,
      scoreType: [(quiz.score_type ?? "band") as "band" | "percentage", quiz.score_type ?? "band"],
      audio: quiz.audio_url
        ? { node: { id: quiz.id, mediaItemUrl: quiz.audio_url, databaseId: 0 } }
        : undefined,
      passages: (quiz.passages ?? []).map((p) => ({
        title: p.title ?? "",
        passage_content: p.content ?? "",
        audio_start: p.audio_start?.toString(),
        audio_end: p.audio_end?.toString(),
        questions: (p.questions ?? []).map((q) => ({
          question_form: [
            (q.question_form ?? "uncategorized") as any,
            q.question_form ?? "uncategorized",
          ] as [string, string],
          title: q.title ?? "",
          type: [q.type, q.type] as [string, string],
          question: q.question_text ?? undefined,
          instructions: q.instructions ?? undefined,
          list_of_questions: q.list_of_questions?.map((lq) => ({
            question: lq.question,
            correct: typeof lq.correct === "string" ? parseInt(lq.correct, 10) || 0 : Number(lq.correct),
            options: (lq.options ?? []).map((o) => ({
              content: o.option_text ?? (o as any).content ?? "",
            })),
          })) ?? undefined,
          list_of_options: q.list_of_options?.map((lo) => ({
            option: lo.option_text ?? (lo as any).option ?? "",
            correct: lo.correct,
          })) ?? undefined,
          explanations: (q.explanations ?? []).map((e) => ({ content: e.content })),
          matchingQuestion: q.matching_question
            ? {
              layoutType: q.matching_question.layout_type,
              summaryText: q.matching_question.summary_text ?? "",
              matchingItems: q.matching_question.matching_items.map((mi) => ({
                questionPart: mi.questionPart,
                correctAnswer: mi.correctAnswer,
              })),
              answerOptions: q.matching_question.answer_options.map((ao) => ({
                optionText: ao.option_text ?? (ao as any).optionText ?? "",
              })),
            }
            : undefined,
          matrixQuestion: q.matrix_question
            ? {
              matrixCategories: q.matrix_question.matrix_categories.map((mc) => ({
                categoryLetter: mc.category_letter ?? (mc as any).categoryLetter ?? "",
                categoryText: mc.category_text ?? (mc as any).categoryText ?? "",
              })),
              matrixItems: q.matrix_question.matrix_items.map((mi) => ({
                itemText: mi.item_text ?? (mi as any).itemText ?? "",
                correctCategoryLetter: mi.correct_category_letter ?? (mi as any).correctCategoryLetter ?? "",
              })),
              layoutType: (q.matrix_question as any).layout_type ?? "standard",
              legendTitle: (q.matrix_question as any).legend_title ?? "",
            }
            : undefined,
        })),
      })) as any,
      pdf: quiz.pdf_url
        ? { node: { id: quiz.id, mediaItemUrl: quiz.pdf_url, databaseId: 0 } }
        : undefined,
    },
  };
}

/**
 * Map Supabase TestResult → legacy ITestResult shape for the context
 */
function toITestResult(tr: Record<string, any>): ITestResult["testResultFields"] {
  return {
    answers: typeof tr.answers === "string" ? tr.answers : JSON.stringify(tr.answers ?? { answers: [] }),
    testPart: typeof tr.test_part === "string" ? tr.test_part : JSON.stringify(tr.test_part ?? []),
    timeLeft: tr.time_left ?? undefined,
    testTime: tr.test_time ?? 0,
    testMode: tr.test_mode ?? "practice",
  };
}

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { slug, testId },
    } = context;
    const supabase = createServerSupabase(context);

    // 1. Fetch quiz data
    const quiz = await getQuizBySlug(supabase, slug?.toString() || "");

    if (!quiz) {
      return { notFound: true };
    }

    const post = toIPracticeSingle(quiz);

    // 2. If testId provided, resume existing test
    if (testId && typeof testId === "string") {
      try {
        const existingResult = await getTestResultService(supabase, testId);
        if (existingResult) {
          return {
            props: {
              post,
              testID: testId,
              testResult: toITestResult(existingResult),
            },
          };
        }
      } catch (error) {
        console.warn("Test ID not found, creating new test:", error);
      }
    }

    // 3. Create new test via takeTheTest service
    const testPart = Array.from(
      { length: (quiz.passages ?? []).length },
      (_, index) => index
    );

    try {
      const newTestResult = await takeTheTest(supabase, {
        quizId: quiz.id,
        testPart,
        testTime: quiz.time_minutes,
        testMode: "practice",
        retake: false,
      });

      if (!newTestResult?.id) {
        return {
          redirect: {
            statusCode: 302,
            destination: ROUTES.HOME,
          },
        };
      }

      return {
        props: {
          post,
          testID: newTestResult.id,
          testResult: toITestResult(newTestResult),
        },
      };
    } catch (error) {
      console.error("Failed to start test:", error);
      return {
        redirect: {
          statusCode: 302,
          destination: ROUTES.HOME,
        },
      };
    }
  }
);
