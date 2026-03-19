import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";
import { createServerSupabase } from "~supabase/server";
import { getQuizBySlug } from "~services/quiz";
import { takeTheTest, getTestResult as getTestResultService } from "~services/test-flow";
import { safeParseJsonb } from "~services/lib/safeParseJsonb";
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
    seo: {
      breadcrumbs: [
        { text: "Home", url: "/" },
        { text: "Practice Library", url: "/ielts-practice-library" },
        { text: quiz.title, url: `/ielts-practice-library/${quiz.slug}` },
      ],
      fullHead: "",
      title: quiz.title,
    } as IPracticeSingle["seo"],
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
        audio_start: p.audio_start?.toString() ?? undefined,
        audio_end: p.audio_end?.toString() ?? undefined,
        questions: (p.questions ?? []).map((q) => {
          const listOfQuestions = safeParseJsonb<any[]>(q.list_of_questions);
          const listOfOptions = safeParseJsonb<any[]>(q.list_of_options);
          const explanations = safeParseJsonb<any[]>(q.explanations) ?? [];
          const matchingQ = safeParseJsonb<any>(q.matching_question);
          const matrixQ = safeParseJsonb<any>(q.matrix_question);
          return {
          question_form: [
            (q.question_form ?? "uncategorized") as any,
            q.question_form ?? "uncategorized",
          ] as [string, string],
          title: q.title ?? "",
          type: [q.type, q.type] as [string, string],
          question: q.question_text ?? null,
          instructions: q.instructions ?? null,
          list_of_questions: Array.isArray(listOfQuestions) ? listOfQuestions.map((lq) => ({
            question: lq.question,
            correct: typeof lq.correct === "string" ? parseInt(lq.correct, 10) || 0 : Number(lq.correct),
            options: (Array.isArray(lq.options) ? lq.options : []).map((o: any) => ({
              content: o.option_text ?? o.content ?? "",
            })),
          })) : null,
          list_of_options: Array.isArray(listOfOptions) ? listOfOptions.map((lo) => ({
            option: lo.option_text ?? lo.option ?? "",
            correct: lo.correct ?? null,
          })) : null,
          explanations: explanations.map((e: any) => ({ content: e.content ?? "" })),
          matchingQuestion: matchingQ
            ? {
              layoutType: (() => {
                const lt = matchingQ.layout_type ?? matchingQ.layoutType ?? null;
                return Array.isArray(lt) ? lt[0] : lt;
              })(),
              summaryText: matchingQ.summary_text ?? matchingQ.summaryText ?? "",
              matchingItems: (Array.isArray(matchingQ.matching_items) ? matchingQ.matching_items
                : Array.isArray(matchingQ.matchingItems) ? matchingQ.matchingItems : []).map((mi: any) => ({
                questionPart: mi.questionPart ?? mi.question_part ?? "",
                correctAnswer: mi.correctAnswer ?? mi.correct_answer ?? "",
              })),
              answerOptions: (Array.isArray(matchingQ.answer_options) ? matchingQ.answer_options
                : Array.isArray(matchingQ.answerOptions) ? matchingQ.answerOptions : []).map((ao: any) => ({
                optionText: ao.option_text ?? ao.optionText ?? "",
              })),
            }
            : null,
          matrixQuestion: matrixQ
            ? {
              matrixCategories: (Array.isArray(matrixQ.matrix_categories) ? matrixQ.matrix_categories
                : Array.isArray(matrixQ.matrixCategories) ? matrixQ.matrixCategories : []).map((mc: any) => ({
                categoryLetter: mc.category_letter ?? mc.categoryLetter ?? "",
                categoryText: mc.category_text ?? mc.categoryText ?? "",
              })),
              matrixItems: (Array.isArray(matrixQ.matrix_items) ? matrixQ.matrix_items
                : Array.isArray(matrixQ.matrixItems) ? matrixQ.matrixItems : []).map((mi: any) => ({
                itemText: mi.item_text ?? mi.itemText ?? "",
                correctCategoryLetter: mi.correct_category_letter ?? mi.correctCategoryLetter ?? "",
              })),
              layoutType: (() => {
                const lt = matrixQ.layout_type ?? matrixQ.layoutType ?? "standard";
                return Array.isArray(lt) ? lt[0] : lt;
              })(),
              legendTitle: matrixQ.legend_title ?? matrixQ.legendTitle ?? "",
            }
            : null,
        }}),
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
    timeLeft: tr.time_left ?? null,
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
              testResult: { testResultFields: toITestResult(existingResult) },
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
          testResult: { testResultFields: toITestResult(newTestResult) },
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
