import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";
import { createServerSupabase } from "~supabase/server";
import { getQuizBySlug, getRelatedQuizzes } from "~services/quiz";
import { safeParseJsonb } from "~services/lib/safeParseJsonb";
import type { QuizWithPassages, Quiz } from "~services/types/database";
import type { IPracticeSingle } from "./api";
import { isAdminRole } from "~lib/parseRoles";

export { PageIELTSPredictionSingle } from "./ui";

/**
 * Map Supabase QuizWithPassages → legacy IPracticeSingle shape
 * so existing UI components continue to work without modification.
 */
function toIPracticeSingle(
  quiz: QuizWithPassages,
  relatedQuizzes: Quiz[],
  hasAccess: boolean
): IPracticeSingle {
  return {
    id: quiz.id,
    title: quiz.title,
    excerpt: quiz.excerpt ?? "",
    seo: {
      breadcrumbs: [
        { text: "Home", url: "/" },
        { text: "IELTS Prediction", url: "/ielts-prediction" },
        { text: quiz.title, url: `/ielts-prediction/${quiz.slug}` },
      ],
      fullHead: "",
      title: quiz.title,
    } as IPracticeSingle["seo"],
    link: `/ielts-prediction/${quiz.slug}`,
    slug: quiz.slug,
    hasAccess,
    relatedPracticeQuizzes: relatedQuizzes.map((rq) => ({
      id: rq.id,
      databaseId: 0,
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
        start_question_number: p.start_question_number ? Number(p.start_question_number) : undefined,
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
              : 0, // WP ACF migration: null means 0 (first option, lost due to JS falsy)
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
        }}),
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
      query: { slug },
    } = context;
    const supabase = createServerSupabase(context);

    try {
      // quiz fetch + auth check in parallel
      const [quiz, { data: authData }] = await Promise.all([
        getQuizBySlug(supabase, slug?.toString() || ""),
        supabase.auth.getUser(),
      ]);
      const user = authData.user;

      if (!quiz) {
        return { notFound: true };
      }

      // Fire related quizzes early — runs in parallel with profile fetch below
      const relatedQuizzesPromise = getRelatedQuizzes(supabase, quiz.id, {
        skill: quiz.skill,
        source: quiz.source,
        year: quiz.year,
      }).catch(() => []);

      // Check Pro access: if quiz requires Pro and user is not Pro, redirect
      let hasAccess = true;
      if (quiz.pro_user_only) {
        if (!user) {
          hasAccess = false;
        } else {
          const { data: profile } = await supabase
            .from("users")
            .select("is_pro, pro_expiration_date, pro_skills, roles")
            .eq("id", user.id)
            .single();

          const isPro =
            isAdminRole(profile?.roles) ||
            (profile?.is_pro &&
              profile?.pro_expiration_date &&
              new Date(profile.pro_expiration_date) > new Date() &&
              (profile.pro_skills === null || profile.pro_skills.includes(quiz.skill)));

          hasAccess = !!isPro;
        }
      }

      if (!hasAccess) {
        return {
          redirect: {
            destination: ROUTES.HOME,
            permanent: false,
          },
        };
      }

      const relatedQuizzes = await relatedQuizzesPromise;

      const post = toIPracticeSingle(quiz, relatedQuizzes, hasAccess);

      return {
        props: {
          post: JSON.parse(JSON.stringify(post)),
        },
      };
    } catch (error) {
      console.error("Error retrieving prediction single:", error);
      return { notFound: true };
    }
  }
);
