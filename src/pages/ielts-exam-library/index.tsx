import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import type { ExamLibraryHeroConfig } from "./ui/types";
import { createServerSupabase } from "~supabase/server";
import { readConfig } from "~services/cms-config";
import { getExamCollections } from "~services/exam-collection";
import type { ExamCollectionResponse } from "~services/types/database";

export { PageIELTSExamLibrary } from "./ui";

const PAGE_SIZE = 5;

const DEFAULT_HERO: ExamLibraryHeroConfig = {
  title: "IELTS Reading Practice Tests",
  breadcrumb: {
    homeLabel: "Trang chủ",
    currentLabel: "Reading",
    items: [
      { label: "Trang chủ", href: "/" },
      { label: "Reading" },
    ],
  },
};

const EMPTY_DATA: ExamCollectionResponse = {
  data: { reading: [], listening: [] },
  pageInfo: { total: 0, currentPage: 1, totalPages: 0, pageSize: PAGE_SIZE },
};

const parseType = (raw: unknown): "academic" | "general" | undefined => {
  return raw === "academic" || raw === "general" ? raw : undefined;
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const supabase = createServerSupabase(context);
    const { query } = context;

    const type = parseType(query.type);
    const search = typeof query.search === "string" ? query.search : undefined;
    const page = Number(query.page) || 1;
    const questionForm =
      typeof query.questionForm === "string" && query.questionForm
        ? query.questionForm
        : undefined;
    const rawSub = Array.isArray(query.subscription)
      ? query.subscription[0]
      : query.subscription;
    const subscription: "pro" | "free" | undefined =
      rawSub === "pro" || rawSub === "free" ? rawSub : undefined;

    const rawParts = Array.isArray(query.parts) ? query.parts[0] : query.parts;
    const parts: number[] | undefined =
      typeof rawParts === "string" && rawParts.length > 0
        ? rawParts
            .split(",")
            .map((v) => parseInt(v.trim(), 10))
            .filter((n) => !isNaN(n) && n > 0)
        : undefined;

    const [heroResult, dataResult] = await Promise.allSettled([
      readConfig<ExamLibraryHeroConfig>(supabase, "ielts-exam-library/hero-banner"),
      getExamCollections(supabase, {
        type,
        search,
        page,
        pageSize: PAGE_SIZE,
        questionForm,
        subscription,
        parts,
      }),
    ]);

    const heroConfig: ExamLibraryHeroConfig =
      heroResult.status === "fulfilled" && heroResult.value
        ? heroResult.value
        : DEFAULT_HERO;

    const initialData: ExamCollectionResponse =
      dataResult.status === "fulfilled" ? dataResult.value : EMPTY_DATA;

    return {
      props: {
        heroConfig,
        initialData,
      },
    };
  }
);
