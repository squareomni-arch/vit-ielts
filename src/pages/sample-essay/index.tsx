import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import _ from "lodash";
import { ROUTES } from "@/shared/routes";
import { createServerSupabase } from "~supabase/server";
import { getSampleEssays, getSampleEssayBySlug } from "~services/sample-essay";
import { readConfig } from "~services/cms-config";
import type { SampleEssayBannerConfig } from "./ui/archive/types";
import type { SampleEssayFilters } from "~services/types/database";

export * from "./ui";

/**
 * SSR for sample essay archive pages.
 * Replaces Apollo GET_SAMPLE_ESSAYS + GET_FILTER_DATA queries and internal API fetch for banner config.
 */
export const getServerSidePropsArchive = async (
  context: GetServerSidePropsContext,
  skill: "speaking" | "writing" | "reading" | "listening"
): ReturnType<GetServerSideProps> => {
  const pageSize = 18;
  const paged =
    context.query.slug?.at(-2) === "page" ? context.query.slug.at(-1) : 1;

  const params = _.omit(context.query, ["slug"]);
  const supabase = createServerSupabase(context);

  // Build filters for Supabase
  const filters: SampleEssayFilters = {
    skill,
    page: Number(paged),
    pageSize,
    part: params.part as string | undefined,
    questionType: params.questionType as string | undefined,
    quarter: params.quarter as string | undefined,
    year: params.year as string | undefined,
    source: params.source as string | undefined,
    topic: params.topic as string | undefined,
    task: params.task as string | undefined,
    passage: params.passage as string | undefined,
    search: params.search as string | undefined,
  };

  // Parallel: fetch essays + banner config
  const [essaysResult, bannerConfig] = await Promise.all([
    getSampleEssays(supabase, filters),
    readConfig<SampleEssayBannerConfig>(supabase, "sample-essay/banner").catch(() => null),
  ]);

  const defaultBannerConfig: SampleEssayBannerConfig = {
    writing: {
      title: {
        line1: "DOL IELTS Writing",
        line2Highlighted: "Task 1 Academic",
        line2After: "Sample",
      },
      description: {
        line1: "Tổng hợp bài mẫu IELTS Exam Writing Task 1 và hướng dẫn cách làm bài,",
        line2: "từ vựng chi tiết theo chủ đề.",
      },
      backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
      button: { text: "Tìm hiểu khóa học", link: "#" },
    },
    speaking: {
      title: {
        line1: "DOL IELTS Speaking",
        line2Highlighted: "Task 1 Academic",
        line2After: "Sample",
      },
      description: {
        line1: "Tổng hợp bài mẫu IELTS Exam Speaking Task 1 và hướng dẫn cách làm bài,",
        line2: "từ vựng chi tiết theo chủ đề.",
      },
      backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
      button: { text: "Tìm hiểu khóa học", link: "#" },
    },
  };

  return {
    props: {
      nodes: essaysResult.data,
      pageInfo: {
        offsetPagination: {
          total: essaysResult.count,
        },
      },
      filterData: {
        sampleEssayFilterData: {
          parts: [],
          questionTypes: [],
          quarters: [],
          years: [],
          sources: [],
          topics: [],
        },
      },
      paged: Number(paged),
      pageSize,
      skill,
      bannerConfig: bannerConfig ?? defaultBannerConfig,
    },
  };
};

export type SampleEssayProps = {
  paged: number;
  pageSize: number;
  skill: "speaking" | "writing" | "reading" | "listening";
  filterData: Record<string, any>;
  bannerConfig: SampleEssayBannerConfig;
  nodes: any[];
  pageInfo: { offsetPagination: { total: number } };
  // Legacy compat fields used by UI components
  sampleEssays?: any;
  seo?: any;
};

/**
 * SSR for sample essay single pages.
 * Replaces Apollo GET_SAMPLE_ESSAY_BY_SLUG query.
 */
export const getServerSidePropsSingle = async (
  context: GetServerSidePropsContext,
  singleID: string
): ReturnType<GetServerSideProps> => {
  const supabase = createServerSupabase(context);

  const essay = await getSampleEssayBySlug(supabase, singleID);

  if (!essay) {
    return { notFound: true };
  }

  // Check Pro access
  if (essay.pro_user_only) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        redirect: {
          destination: ROUTES.HOME,
          permanent: false,
        },
      };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_pro, pro_expiration_date, roles")
      .eq("id", user.id)
      .single();

    const roles: string[] = Array.isArray(profile?.roles) ? profile.roles : [];
    const isPro =
      roles.includes("administrator") ||
      (profile?.is_pro &&
        profile?.pro_expiration_date &&
        new Date(profile.pro_expiration_date) > new Date());

    if (!isPro) {
      return {
        redirect: {
          destination: ROUTES.HOME,
          permanent: false,
        },
      };
    }
  }

  return {
    props: {
      sampleEssay: essay,
    },
  };
};
