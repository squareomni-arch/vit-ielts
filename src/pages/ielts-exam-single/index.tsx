import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { createServerSupabase } from "~supabase/server";
import { getQuizBySlug, getQuizBySlugPreview, getRelatedQuizzes } from "~services/quiz";
import { safeParseJsonb } from "~services/lib/safeParseJsonb";
import type { QuizWithPassages, Quiz } from "~services/types/database";
import type { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { isAdminRole } from "~lib/parseRoles";
import { createClient } from "@supabase/supabase-js";

export { PageIELTSExamSingle } from "./ui";

/**
 * Map Supabase QuizWithPassages → legacy IPracticeSingle shape
 * Reuses the same shape so we can reuse the same UI component layout.
 */
function toExamSingleData(
  quiz: QuizWithPassages,
  relatedQuizzes: Quiz[]
): IPracticeSingle {
  return {
    id: quiz.id,
    title: quiz.title,
    excerpt: quiz.excerpt ?? "",
    seo: {
      breadcrumbs: [
        { text: "Home", url: "/" },
        { text: "IELTS Exam Library", url: "/ielts-exam-library" },
        { text: quiz.title, url: `/ielts-exam-library/${quiz.slug}` },
      ],
      fullHead: "",
      title: quiz.title,
    } as IPracticeSingle["seo"],
    link: `/ielts-exam-library/${quiz.slug}`,
    slug: quiz.slug,
    hasAccess: true, // Access control is handled client-side for exams
    relatedPracticeQuizzes: relatedQuizzes.map((rq) => ({
      databaseId: 0,
      id: rq.id,
      title: rq.title,
      featuredImage: rq.featured_image || false,
      excerpt: rq.excerpt ?? "",
      slug: rq.slug,
    })),
    author: {
      node: {
        userData: {},
        name: "IELTS Prediction",
      },
    },
    date: quiz.published_at ?? quiz.created_at,
    featuredImage: quiz.featured_image
      ? {
        node: {
          sourceUrl: quiz.featured_image,
          altText: quiz.title,
        },
      }
      : undefined,
    quizFields: {
      testsTaken: quiz.tests_taken ?? 0,
      proUserOnly: quiz.pro_user_only,
      type: [(quiz.type as "practice" | "academic" | "general"), quiz.type],
      skill: [quiz.skill, quiz.skill],
      time: quiz.time_minutes,
      scoreType: [(quiz.score_type ?? "band") as "band" | "percentage", quiz.score_type ?? "band"],
      audio: quiz.audio_url
        ? {
          node: {
            id: quiz.id,
            mediaItemUrl: quiz.audio_url,
            databaseId: 0,
          },
        }
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
              (q.question_form ?? "uncategorized") as IPracticeSingle["quizFields"]["passages"][0]["questions"][0]["question_form"][0],
              q.question_form ?? "uncategorized",
            ],
            title: q.title ?? "",
            type: [
              q.type as IPracticeSingle["quizFields"]["passages"][0]["questions"][0]["type"][0],
              q.type,
            ],
            question: q.question_text ?? undefined,
            instructions: q.instructions ?? undefined,
            list_of_questions: Array.isArray(listOfQuestions) ? listOfQuestions.map((lq) => ({
              question: lq.question,
              correct: lq.correct != null
                ? (typeof lq.correct === "string" ? (parseInt(lq.correct, 10) || 0) : Number(lq.correct))
                : 0,
              options: (Array.isArray(lq.options) ? lq.options : []).map((o: any) => ({
                content: o.option_text ?? o.content ?? "",
              })),
            })) : undefined,
            list_of_options: Array.isArray(listOfOptions) ? listOfOptions.map((lo) => ({
              option: lo.option_text ?? lo.option ?? "",
              correct: lo.correct ?? undefined,
            })) : undefined,
            explanations: explanations.map((e: any) => ({
              content: e.content ?? "",
            })),
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
              : undefined,
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
              : undefined,
          };
        }),
      })),
      pdf: quiz.pdf_url
        ? {
          node: {
            id: quiz.id,
            mediaItemUrl: quiz.pdf_url,
            databaseId: 0,
          },
        }
        : undefined,
    },
  };
}

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { slug, preview },
    } = context;
    const supabase = createServerSupabase(context);
    const isPreview = preview === "true";

    try {
      let quiz: QuizWithPassages | null = null;

      if (isPreview) {
        // Preview mode: verify admin role before loading draft content
        // Admin panel uses isolated auth session (sb-admin-auth cookies),
        // so we check both regular and admin sessions.
        // Lazily create service-role client (bypasses RLS)
        const sAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        let adminUserId: string | null = null;

        // 1. Try regular session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          adminUserId = user.id;
        } else {
          // 2. Try admin session
          const { createAdminServerSupabase } = await import("~supabase/server");
          const adminSupabase = createAdminServerSupabase(context);
          const { data: { user: aUser } } = await adminSupabase.auth.getUser();
          if (aUser) adminUserId = aUser.id;
        }

        // 3. Verify admin role (use service role client to bypass RLS)
        if (adminUserId) {
          const { data: profile } = await sAdmin
            .from("users")
            .select("roles")
            .eq("id", adminUserId)
            .single();
          if (isAdminRole(profile?.roles)) {
            quiz = await getQuizBySlugPreview(sAdmin, slug?.toString() || "");
          }
        }
      } else {
        quiz = await getQuizBySlug(supabase, slug?.toString() || "");
      }

      // Only allow exam types (academic/general), not practice quizzes
      if (!quiz || quiz.type === "practice") {
        return { notFound: true };
      }

      // Get related quizzes (same skill, source, year)
      const relatedQuizzes = await getRelatedQuizzes(supabase, quiz.id).catch(() => []);

      const post = toExamSingleData(quiz, relatedQuizzes);

      return {
        props: {
          post: JSON.parse(JSON.stringify(post)),
          isPreview,
        },
      };
    } catch (error) {
      console.error("Error retrieving exam single:", error);
      return { notFound: true };
    }
  }
);
