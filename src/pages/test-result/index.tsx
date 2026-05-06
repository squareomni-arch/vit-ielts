import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getTestResult } from "~services/test-flow";
import { getQuizBySlug } from "~services/quiz";
import { getUserProfile } from "~services/user";
import { calculateScore } from "@/shared/lib";
import { safeParseJsonb } from "~services/lib/safeParseJsonb";
import type { ITestResult, IUser, IPracticeSingle } from "./api";
import type { QuizWithPassages } from "~services/types/database";

export { PageTestResult } from "./ui";

/**
 * Map Supabase QuizWithPassages → legacy IPracticeSingle shape for test-result page
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
    author: {
      node: { name: "IELTS Prediction" },
    },
    date: quiz.published_at ?? quiz.created_at,
    featuredImage: quiz.featured_image
      ? { node: { sourceUrl: quiz.featured_image, altText: quiz.title } }
      : null,
    quizFields: {
      testsTaken: quiz.tests_taken ?? 0,
      proUserOnly: quiz.pro_user_only,
      type: [quiz.type, quiz.type],
      skill: [quiz.skill, quiz.skill],
      time: quiz.time_minutes,
      scoreType: [quiz.score_type ?? "band", quiz.score_type ?? "band"],
      audio: quiz.audio_url
        ? { node: { id: quiz.id, mediaItemUrl: quiz.audio_url } }
        : null,
      passages: (quiz.passages ?? []).map((p) => ({
        title: p.title ?? "",
        passage_content: p.content ?? "",
        start_question_number: (p.start_question_number !== null && p.start_question_number !== undefined) ? Number(p.start_question_number) : null,
        questions: (p.questions ?? []).map((q) => {
          const listOfQuestions = safeParseJsonb<any[]>(q.list_of_questions);
          const listOfOptions = safeParseJsonb<any[]>(q.list_of_options);
          const explanations = safeParseJsonb<any[]>(q.explanations) ?? [];
          const matchingQ = safeParseJsonb<any>(q.matching_question);
          const matrixQ = safeParseJsonb<any>(q.matrix_question);
          return {
          question_form: [q.question_form ?? "uncategorized", q.question_form ?? "uncategorized"] as [string, string],
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
              optionsTitle: matchingQ.options_title ?? matchingQ.optionsTitle ?? "",
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
      })),
    },
  };
}

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { id },
    } = context;
    const supabase = createServerSupabase(context);

    // 1. Fetch test result from Supabase
    const testResultRow = await getTestResult(supabase, id?.toString() || "");

    if (!testResultRow || testResultRow.status !== "published") {
      return { notFound: true };
    }

    // 2. Fetch quiz data
    const quiz = await getQuizBySlug(supabase, "").catch(() => null);
    // Actually we need to get quiz by ID, not slug. Let's query directly.
    let quizData: QuizWithPassages | null = null;
    {
      const { data, error } = await supabase
        .from("quizzes")
        .select(`*, passages(*, questions(*))`)
        .eq("id", testResultRow.quiz_id)
        .single();
      if (!error && data) {
        // Sort nested data
        const sorted = {
          ...data,
          passages: ((data as any).passages ?? [])
            .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((p: any) => ({
              ...p,
              questions: (p.questions ?? []).sort(
                (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
              ),
            })),
        };
        quizData = sorted as QuizWithPassages;
      }
    }

    if (!quizData) {
      return { notFound: true };
    }

    const post = toIPracticeSingle(quizData);

    // 3. Fetch user profile
    const userProfile = await getUserProfile(supabase, testResultRow.user_id).catch(() => null);

    const user: IUser = {
      name: userProfile?.name ?? "",
      userData: {
        avatar: userProfile?.avatar_url
          ? {
            node: {
              mediaDetails: {
                sizes: [{ sourceUrl: userProfile.avatar_url, width: "96" }],
              },
              srcSet: userProfile.avatar_url,
            },
          }
          : null,
      },
    };

    // 4. Build legacy testResult shape
    const answers = testResultRow.answers ?? { answers: [] };
    const testPart = testResultRow.test_part ?? [];

    const testResult: ITestResult = {
      id: testResultRow.id,
      testResultFields: {
        answers: typeof answers === "string" ? answers : JSON.stringify(answers),
        dateSubmitted: testResultRow.submitted_at ?? testResultRow.created_at,
        dateTaken: testResultRow.created_at,
        score: testResultRow.score ?? 0,
        quiz: {
          node: {
            id: quizData.id,
          },
        },
        testPart: typeof testPart === "string" ? testPart : JSON.stringify(testPart),
        testTime: testResultRow.test_time ?? 0,
        timeLeft: testResultRow.time_left ?? "0",
      },
      status: testResultRow.status === "published" ? "publish" : "draft",
      authorId: testResultRow.user_id,
    };

    // 5. Calculate score
    const parsedAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;
    const parsedTestPart = typeof testPart === "string" ? JSON.parse(testPart) : testPart;

    const scoreData = calculateScore(
      parsedAnswers.answers ?? [],
      post,
      parsedTestPart
    );

    return {
      props: {
        post,
        testResult,
        user,
        scoreData,
      },
    };
  }
);
